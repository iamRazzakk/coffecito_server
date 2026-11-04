import ApiError from "../../../errors/ApiErrors";
import { CouponCodeModel, ICouponCode } from "./coupon_code.interface";
import { CouponCode } from "./coupon_code.model";

const createCouponCode = async (payload: ICouponCode) => {
  const couponCode = await CouponCode.create(payload);
  return couponCode;
};

const getAllCouponCodes = async () => {
  const couponCodes = await CouponCode.find().lean();
  return couponCodes;
};

const getCouponCodeById = async (id: string) => {
  const couponCode = await CouponCode.findById(id).lean();
  return couponCode;
};

// coupon code exist or not
const getCouponCodeFromDB = async (code: number) => {
  const result = await CouponCode.findOne({ code, isActive: true }).lean();
  if (!result) {
    throw new ApiError(404, "Coupon code not found");
  }

  return result;
};

const updateCouponCode = async (id: string, payload: ICouponCode) => {
  const couponCode = await CouponCode.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!couponCode) {
    throw new ApiError(404, "Coupon code not found");
  }
  return couponCode;
};

const deleteCouponCode = async (id: string) => {
  const couponCode = await CouponCode.findByIdAndDelete(id);
  if (!couponCode) {
    throw new ApiError(404, "Coupon code not found");
  }
  return couponCode;
};

export const CouponCodeService = {
  createCouponCode,
  getAllCouponCodes,
  getCouponCodeById,
  updateCouponCode,
  deleteCouponCode,
  getCouponCodeFromDB,
};
