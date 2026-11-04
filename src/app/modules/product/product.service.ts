import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../builder/queryBuilder";
import { IDirectPurchasePayload, IProduct } from "./product.interface";
import { Product } from "./product.model";
import ApiError from "../../../errors/ApiErrors";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { Purchase } from "../purchase/purchase.model";
import stripe from "../../../config/stripe";
import config from "../../../config";
import { prepareDirectPurchase } from "./product.helper";
import { Favorite } from "../favorite/favorite.model";

const createProductToDB = async (payload: IProduct, user: JwtPayload) => {
  payload.shopId = new Types.ObjectId(user.id);
  const product = await Product.create(payload);
  return product;
};

const getAllProductsFromDB = async (query: Record<string, any>) => {
  const qb = new QueryBuilder(Product.find(), query)
    .filter()
    .fields()
    .sort()
    .paginate()
    .populate(["categoryId"], {});

  const [data, meta] = await Promise.all([
    qb.modelQuery.exec(),
    qb.getPaginationInfo(),
  ]);
  return {
    data,
    meta,
  };
};
const getAllProductsFilterByStatusFromDB = async (
  query: Record<string, any>,
  id: string,
) => {
  const product = await Product.findOne({ status: true, categoryId: id });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }
  const qb = new QueryBuilder(
    Product.find({ status: true, categoryId: id }),
    query,
  )
    .filter()
    .fields()
    .sort()
    .paginate()
    .populate(["categoryId"], {});

  const [data, meta] = await Promise.all([
    qb.modelQuery.lean().exec(),
    qb.getPaginationInfo(),
  ]);
  return {
    data,
    meta,
  };
};

const getProductByIdFromDB = async (id: string, user: JwtPayload) => {
  const product = await Product.findById(id).populate("categoryId").lean();
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const isFavorite = Boolean(
    await Favorite.exists({ userId: user.id, productId: product._id }),
  );

  return { ...product, isFavorite };
};

const updateProductByIdToDB = async (
  id: string,
  payload: Partial<IProduct>,
) => {
  const product = await Product.findByIdAndUpdate(id, payload, { new: true });
  return product;
};

const deleteProductByIdFromDB = async (id: string) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: false },
    { new: true },
  );
  return product;
};

const purchaseProductDirectly = async (
  productId: string,
  payload: IDirectPurchasePayload,
  user: JwtPayload,
) => {
  if (!config.stripe.paymentSuccessUrl || !config.stripe.paymentCancelUrl) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Payment redirect urls are missing",
    );
  }

  const product = await Product.findOne({
    _id: productId,
    status: true,
  }).lean();
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const checkout = prepareDirectPurchase(product, payload);

  const purchase = await Purchase.create({
    cartId: [],
    userId: new Types.ObjectId(user.id),
    subtotal: checkout.subtotal,
    offerDiscountAmount: 0,
    couponDiscountAmount: 0,
    discountAmount: 0,
    taxableAmount: checkout.subtotal,
    taxAmount: checkout.taxAmount,
    amount: checkout.amount,
    items: [
      {
        productId: product._id,
        quantity: checkout.quantity,
        size: checkout.size,
        unitPrice: checkout.unitPrice,
      },
    ],
    status: "pending",
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: config?.stripe?.paymentSuccessUrl,
      cancel_url: config?.stripe?.paymentCancelUrl,
      line_items: [checkout.stripeLineItem],
      metadata: {
        purchaseId: purchase?._id?.toString(),
        userId: user?.id,
        checkoutType: "direct_product",
      },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout url");

    return {
      url: session.url,
      purchaseId: purchase._id,
      amount: checkout.amount,
    };
  } catch (error) {
    await Purchase.updateOne({ _id: purchase._id }, { status: "failed" });
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create payment url");
  }
};

export const ProductServices = {
  createProductToDB,
  getAllProductsFromDB,
  getAllProductsFilterByStatusFromDB,
  getProductByIdFromDB,
  updateProductByIdToDB,
  deleteProductByIdFromDB,
  purchaseProductDirectly,
};
