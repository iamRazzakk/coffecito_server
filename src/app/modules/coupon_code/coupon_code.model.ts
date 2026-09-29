import { Schema, model } from "mongoose";
import { ICouponCode, CouponCodeModel } from "./coupon_code.interface";

const couponCodeSchema = new Schema<ICouponCode, CouponCodeModel>({
  percentage: {
    type: Number,
    required: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  minOrderAmount: {
    type: Number,
    required: false,
  },
  minDiscountAmount: {
    type: Number,
    required: false,
  },
  code: {
    type: Number,
    required: true,
  },
  expireDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// indexes
couponCodeSchema.index({ percentage: 1, code: 1 }, { unique: true });
couponCodeSchema.index({ isActive: 1 });

export const CouponCode = model<ICouponCode, CouponCodeModel>(
  "CouponCode",
  couponCodeSchema,
);
