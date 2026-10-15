import { Schema, model } from "mongoose";
import { IPurchase, PurchaseModel } from "./purchase.interface";

const purchaseItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    size: {
      type: String,
      enum: ["S", "M", "L"],
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const purchaseSchema = new Schema<IPurchase, PurchaseModel>(
  {
    cartId: {
      type: [Schema.Types.ObjectId],
      ref: "Cart",
      required: true,
    },
    items: {
      type: [purchaseItemSchema],
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    couponCodeId: {
      type: Schema.Types.ObjectId,
      ref: "CouponCode",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);
purchaseSchema.index({ status: 1, cartId: 1 });
export const Purchase = model<IPurchase, PurchaseModel>(
  "Purchase",
  purchaseSchema,
);
