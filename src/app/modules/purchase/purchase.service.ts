import { JwtPayload } from "jsonwebtoken";
import { Cart } from "../cart/cart.model";
import { IPurchase } from "./purchase.interface";
import { Purchase } from "./purchase.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { Product } from "../product/product.model";
import { getProductUnitPrice } from "../product/product.utils";
import stripe from "../../../config/stripe";
import config from "../../../config";
import QueryBuilder from "../../builder/queryBuilder";

const createPurchaseDataIntoDB = async (
  payload: Pick<IPurchase, "cartId" | "couponCodeId">,
  user: JwtPayload,
) => {
  if (!payload.cartId?.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cart ids are required");
  }
  if (!config.stripe.paymentSuccessUrl) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Payment success url is missing",
    );
  }
  const cartItems = await Cart.find({
    _id: { $in: payload.cartId },
    userId: new Types.ObjectId(user.id),
  });
  if (cartItems.length !== payload.cartId.length) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "One or more cart items not found",
    );
  }
  const products = await Product.find({
    _id: { $in: cartItems.map((item) => item.productId) },
  }).lean();
  const productById = new Map(
    products.map((product) => [product._id.toString(), product]),
  );
  const pricedItems = cartItems.map((item) => {
    const product = productById.get(item.productId.toString());
    if (!product || !product.status) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "A product in your cart is unavailable",
      );
    }
    const unitPrice = getProductUnitPrice(product);
    return { item, product, unitPrice };
  });
  const amount = pricedItems.reduce(
    (sum, row) => sum + row.unitPrice * row.item.quantity,
    0,
  );
  await Cart.bulkWrite(
    pricedItems.map((row) => ({
      updateOne: {
        filter: { _id: row.item._id },
        update: {
          $set: {
            unitPrice: row.unitPrice,
            lockedUnitPrice: row.unitPrice,
          },
        },
      },
    })),
  );
  const purchase = await Purchase.create({
    cartId: cartItems.map((item) => item._id),
    userId: new Types.ObjectId(user.id),
    amount,
    couponCodeId: payload.couponCodeId,
    status: "pending",
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: config.stripe.paymentSuccessUrl,
    cancel_url: config.stripe.paymentSuccessUrl,
    line_items: pricedItems.map((row) => ({
      quantity: row.item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(row.unitPrice * 100),
        product_data: {
          name: row.product.productName,
        },
      },
    })),
    metadata: {
      purchaseId: purchase._id.toString(),
      userId: user.id,
    },
  });
  if (!session.url) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create payment url");
  }
  return { url: session.url, purchaseId: purchase._id };
};

const getMyPurchasesHistoryFromDB = async (
  user: JwtPayload,
  query: Record<string, any>,
) => {
  const purchases = new QueryBuilder(
    Purchase.find({ userId: new Types.ObjectId(user.id) }),
    query,
  )
    .filter()
    .sort()
    .paginate();
  const [meta, data] = await Promise.all([
    purchases.getPaginationInfo(),
    purchases.modelQuery.exec(),
  ]);
  return { meta, data };
};

const getAllPurchaseHistoryFromDB = async (query: Record<string, any>) => {
  const purchases = new QueryBuilder(Purchase.find(), query)
    .filter()
    .sort()
    .populate(["userId"], {
      userId: "name phone",
    })
    .paginate();
  const [meta, data] = await Promise.all([
    purchases.getPaginationInfo(),
    purchases.modelQuery.exec(),
  ]);
  return { meta, data };
};

export const PurchaseServices = {
  createPurchaseDataIntoDB,
  getMyPurchasesHistoryFromDB,
  getAllPurchaseHistoryFromDB,
};
