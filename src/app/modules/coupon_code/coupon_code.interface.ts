import { Model } from "mongoose";

export type ICouponCode = {
  code: number;
  discountType: "percentage" | "fixed";
  percentage: number;
  minOrderAmount?: number;
  minDiscountAmount?: number;
  expireDate?: Date;
  isActive: boolean;
};

export type CouponCodeModel = Model<ICouponCode>;
