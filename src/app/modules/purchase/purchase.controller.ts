import { Request, Response, NextFunction } from "express";
import { PurchaseServices } from "./purchase.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

const createPurchase = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await PurchaseServices.createPurchaseDataIntoDB(
    payload,
    req.user,
  );
  sendResponse(res, {
    success: true,
    message: "Purchase created successfully",
    statusCode: StatusCodes.CREATED,
    data: result,
  });
});

const getMyPurchasesHistory = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query;
    const result = await PurchaseServices.getMyPurchasesHistoryFromDB(
      req.user,
      query,
    );
    sendResponse(res, {
      success: true,
      message: "Purchase history fetched successfully",
      statusCode: StatusCodes.OK,
      pagination: result.meta,
      data: result.data,
    });
  },
);

const getAllPurchaseHistory = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query;
    const result = await PurchaseServices.getAllPurchaseHistoryFromDB(query);
    sendResponse(res, {
      success: true,
      message: "Purchase history fetched successfully",
      statusCode: StatusCodes.OK,
      pagination: result.meta,
      data: result.data,
    });
  },
);

export const PurchaseController = {
  createPurchase,
  getMyPurchasesHistory,
  getAllPurchaseHistory,
};
