import { Schema, model } from "mongoose";
import {
  IProduct,
  IProductExtra,
  IProductSize,
  ProductModel,
} from "./product.interface";

const productSizeSchema = new Schema<IProductSize>(
  {
    name: {
      type: String,
      enum: ["S", "M", "L"],
      required: true,
    },
    additionalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const productExtraSchema = new Schema<IProductExtra>(
  {
    name: {
      type: String,
      required: false,
    },
    additionalPrice: {
      type: Number,
      required: false,
      min: 0,
    },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct, ProductModel>(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
    },
    sizes: {
      type: [productSizeSchema],
      default: [],
    },
    extras: {
      type: [productExtraSchema],
      default: [],
    },
    status: {
      type: Boolean,
      default: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    taxPercentage: {
      type: Number,
      min: 0,
    },
    point: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ productName: 1, categoryId: 1, createdAt: -1 });
export const Product = model<IProduct, ProductModel>("Product", productSchema);
