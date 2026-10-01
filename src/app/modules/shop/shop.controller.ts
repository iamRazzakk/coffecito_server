import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ShopServices } from "./shop.service";

const createShop = catchAsync(async (req: Request, res: Response) => {
  const shop = await ShopServices.createShopToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Shop created successfully",
    data: shop,
  });
});

const getAllShops = catchAsync(async (req: Request, res: Response) => {
  const shops = await ShopServices.getAllShopsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shops fetched successfully",
    pagination: shops.meta,
    data: shops.data,
  });
});

const getShopById = catchAsync(async (req: Request, res: Response) => {
  const shop = await ShopServices.getShopByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop fetched successfully",
    data: shop,
  });
});

const updateShopById = catchAsync(async (req: Request, res: Response) => {
  const shop = await ShopServices.updateShopByIdToDB(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop updated successfully",
    data: shop,
  });
});

const deleteShopById = catchAsync(async (req: Request, res: Response) => {
  const shop = await ShopServices.deleteShopByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Shop deleted successfully",
    data: shop,
  });
});

export const ShopController = {
  createShop,
  getAllShops,
  getShopById,
  updateShopById,
  deleteShopById,
};
