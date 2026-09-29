import { Model, Types } from "mongoose";

export type IPurchase = {
  cartId: Types.ObjectId[];
  userId: Types.ObjectId;
  amount: number;
  couponCodeId?: Types.ObjectId;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
};

export type PurchaseModel = Model<IPurchase>;
