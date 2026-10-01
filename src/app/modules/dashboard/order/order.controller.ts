import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { OrderService } from "./order.service";

const getOrderOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await OrderService.orderOvierviewFromDB();
  sendResponse(res, {
    success: true,
    message: "Order overview fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.allOrderFromDB(req.query);
  sendResponse(res, {
    success: true,
    message: "Orders fetched successfully",
    statusCode: StatusCodes.OK,
    pagination: result.meta,
    data: result.data,
  });
});

export const OrderController = { getOrderOverview, getAllOrders };
