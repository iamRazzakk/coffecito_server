import { Model } from "mongoose";

export type ICouponCode = {
  percentage: number;
  code: number;
  expireDate: Date;
  isActive: boolean;
};

export type CouponCodeModel = Model<ICouponCode>;