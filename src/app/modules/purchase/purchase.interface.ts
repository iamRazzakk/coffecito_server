import { Model, Types } from "mongoose";

export type IPurchaseItem = {
  productId: Types.ObjectId;
  quantity: number;
  size: "S" | "M" | "L";
  unitPrice: number;
};

export type IPurchase = {
  cartId: Types.ObjectId[];
  userId: Types.ObjectId;
  amount: number;
  couponCodeId?: Types.ObjectId;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  items?: IPurchaseItem[];
};

export type PurchaseModel = Model<IPurchase>;
