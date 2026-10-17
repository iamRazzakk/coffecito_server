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
    subtotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    offerDiscountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    couponDiscountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: false,
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
