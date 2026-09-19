import { Model, Types } from "mongoose";

export type ICart = {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  lockedOriginalPrice: number;
  lockedDiscountPrice: number;
  lockedUnitPrice: number;
  priceLockedUntil: Date;
  quantity: number;
  size: "S" | "M" | "L";
};

export type CartModel = Model<ICart>;
