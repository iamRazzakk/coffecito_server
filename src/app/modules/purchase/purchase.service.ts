import { JwtPayload } from "jsonwebtoken";
import { Cart } from "../cart/cart.model";
import { IPurchase, PurchaseModel } from "./purchase.interface";
import { Purchase } from "./purchase.model";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import stripe from "../../../config/stripe";
import config from "../../../config";
import { IUser } from "../user/user.interface";
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
  const amount = cartItems.reduce(
    (sum, item) => sum + item.lockedUnitPrice * item.quantity,
    0,
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
    line_items: cartItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(item.lockedUnitPrice * 100),
        product_data: { name: `Size ${item.size}` },
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
