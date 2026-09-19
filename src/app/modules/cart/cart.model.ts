import { Schema, model } from "mongoose";
import { ICart, CartModel } from "./cart.interface";

const cartSchema = new Schema<ICart, CartModel>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lockedOriginalPrice: {
      type: Number,
      required: false,
    },

    lockedDiscountPrice: {
      type: Number,
      required: false,
    },

    lockedUnitPrice: {
      type: Number,
      required: true,
    },

    priceLockedUntil: {
      type: Date,
      required: true,
    },

    size: {
      type: String,
      enum: ["S", "M", "L"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true },
);

// indexes
cartSchema.index({ userId: 1, productId: 1, size: 1 }, { unique: true });
cartSchema.index({ userId: 1 });

export const Cart = model<ICart, CartModel>("Cart", cartSchema);
