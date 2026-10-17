import mongoose, { Schema, model } from "mongoose";
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
    size: {
      type: String,
      enum: ["S", "M", "L"],
      required: true,
    },
    extras: {
      type: [String],
      default: [],
    },
    extrasKey: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    addedUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lockedUnitPrice: {
      type: Number,
      required: false,
      min: 0,
    },
  },
  { timestamps: true },
);

cartSchema.index(
  { userId: 1, productId: 1, size: 1, extrasKey: 1 },
  { unique: true },
);
cartSchema.index({ userId: 1 });

export const Cart = model<ICart, CartModel>("Cart", cartSchema);

const dropSizeLessUniqueIndex = () => {
  void Cart.collection.dropIndex("userId_1_productId_1").catch(() => undefined);
  void Cart.collection
    .dropIndex("userId_1_productId_1_size_1")
    .catch(() => undefined);
};

if (mongoose.connection.readyState === 1) {
  dropSizeLessUniqueIndex();
} else {
  mongoose.connection.once("open", dropSizeLessUniqueIndex);
}
