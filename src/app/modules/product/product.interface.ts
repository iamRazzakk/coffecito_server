import { Model, Types } from "mongoose";

export interface IProductSize {
  name: "S" | "M" | "L";
  additionalPrice: number;
}

export interface IProductExtra {
  name: string;
  additionalPrice: number;
}

export interface IProduct {
  productName: string;
  categoryId: Types.ObjectId;
  description?: string;
  image: string;
  originalPrice: number;
  discountPrice?: number;
  costPrice?: number;
  sizes: IProductSize[];
  extras: IProductExtra[];
  status: boolean;
  shopId: Types.ObjectId;
  taxPercentage?: number;
  point?: number;
}

export type ProductModel = Model<IProduct>;
