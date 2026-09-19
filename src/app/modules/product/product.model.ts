import { Schema, model } from "mongoose";
import { IProduct, ProductModel } from "./product.interface";

const productSchema = new Schema<IProduct, ProductModel>(
  {
    productName: {
      type: String,
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    size: {
      type: String,
      enum: ["S", "M", "L"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ productName: 1, categoryId: 1, createdAt: -1 });
export const Product = model<IProduct, ProductModel>("Product", productSchema);
