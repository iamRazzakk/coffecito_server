import { Request, Response, NextFunction } from "express";
import { CouponCodeService } from "./coupon_code.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";

const createCouponCode = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const couponCode = await CouponCodeService.createCouponCode(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Coupon code created successfully",
      data: couponCode,
    });
  },
);

const getCouponCodeById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const couponCode = await CouponCodeService.getCouponCodeById(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Coupon code fetched successfully",
      data: couponCode,
    });
  },
);
const getAllCouponCodes = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const couponCodes = await CouponCodeService.getAllCouponCodes();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Coupon codes fetched successfully",
      data: couponCodes,
    });
  },
);

const updateCouponCode = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const couponCode = await CouponCodeService.updateCouponCode(req.params.id, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Coupon code updated successfully",
      data: couponCode,
    });
  },
);

const deleteCouponCode = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await CouponCodeService.deleteCouponCode(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Coupon code deleted successfully",
      data: null,
    });
  },
);

export const CouponCodeController = {
  createCouponCode,
  getCouponCodeById,
  getAllCouponCodes,
  updateCouponCode,
  deleteCouponCode,
};
