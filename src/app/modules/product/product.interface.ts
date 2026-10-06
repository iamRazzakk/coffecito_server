import { Model, Types } from "mongoose";

export type IProduct = {
  productName: string;
  categoryId: Types.ObjectId;
  size: "S" | "M" | "L";
  description: string;
  discountPrice: number;
  originalPrice: number;
  image: string;
  status: boolean;
  shopId: Types.ObjectId;
};

export type ProductModel = Model<IProduct>;
