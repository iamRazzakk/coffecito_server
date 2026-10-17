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
  subtotal: number;
  offerDiscountAmount: number;
  couponDiscountAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  amount: number;
  offerId?: Types.ObjectId;
  couponCodeId?: Types.ObjectId;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  items?: IPurchaseItem[];
};

export type PurchaseModel = Model<IPurchase>;
