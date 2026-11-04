import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { GiftServices } from "./gift.service";

const createGift = catchAsync(async (req: Request, res: Response) => {
  const gift = await GiftServices.createGiftToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Gift created successfully",
    data: gift,
  });
});

const getAllGifts = catchAsync(async (req: Request, res: Response) => {
  const gifts = await GiftServices.getAllGiftsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gifts fetched successfully",
    data: gifts,
  });
});

const getGiftById = catchAsync(async (req: Request, res: Response) => {
  const gift = await GiftServices.getGiftByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gift fetched successfully",
    data: gift,
  });
});

const updateGiftById = catchAsync(async (req: Request, res: Response) => {
  const gift = await GiftServices.updateGiftByIdToDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gift updated successfully",
    data: gift,
  });
});

const claimGift = catchAsync(async (req: Request, res: Response) => {
  const result = await GiftServices.claimGiftToDB(req.params.id, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gift collected successfully",
    data: result,
  });
});

const deleteGiftById = catchAsync(async (req: Request, res: Response) => {
  const gift = await GiftServices.deleteGiftByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Gift deleted successfully",
    data: gift,
  });
});

export const GiftController = {
  createGift,
  getAllGifts,
  getGiftById,
  updateGiftById,
  claimGift,
  deleteGiftById,
};
