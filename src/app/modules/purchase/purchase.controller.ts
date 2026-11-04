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
    const { delivaryStatus, ...query } = req.query;
    const result = await PurchaseServices.getMyPurchasesHistoryFromDB(
      req.user,
      query,
      typeof delivaryStatus === "string" ? delivaryStatus : undefined,
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

const getUserOrderHistory = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await PurchaseServices.getUserOrderHistoryFromDB(
    req.user,
    query,
  );
  sendResponse(res, {
    success: true,
    message: "Order history fetched successfully",
    statusCode: StatusCodes.OK,
    pagination: result.meta,
    data: result.data,
  });
});

const getUserLastOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseServices.getUserLastOrderFromDB(
    req.user,
    req.params.id,
  );
  sendResponse(res, {
    success: true,
    message: "Last order fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getOrderDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseServices.getOrderDetailsFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    message: "Order details fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const PurchaseController = {
  createPurchase,
  getMyPurchasesHistory,
  getAllPurchaseHistory,
  getUserOrderHistory,
  getUserLastOrder,
  getOrderDetails,
};
