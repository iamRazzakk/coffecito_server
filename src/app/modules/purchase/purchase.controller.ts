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

export const PurchaseController = { createPurchase };
