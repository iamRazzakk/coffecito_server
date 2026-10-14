import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FavoriteServices } from "./favorite.service";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const result = await FavoriteServices.toggleFavoriteToDB(
    req.user as JwtPayload,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode:
      result.action === "added" ? StatusCodes.CREATED : StatusCodes.OK,
    message:
      result.action === "added"
        ? "Favorite added successfully"
        : "Favorite removed successfully",
    data: result.favorite,
  });
});

const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as "shop" | "product" | undefined;
  const favorites = await FavoriteServices.getMyFavoritesFromDB(
    req.user as JwtPayload,
    type,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Favorites fetched successfully",
    data: favorites,
  });
});

const getFavoriteById = catchAsync(async (req: Request, res: Response) => {
  const favorite = await FavoriteServices.getFavoriteByIdFromDB(
    req.user as JwtPayload,
    req.params.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Favorite fetched successfully",
    data: favorite,
  });
});

const updateFavorite = catchAsync(async (req: Request, res: Response) => {
  const favorite = await FavoriteServices.updateFavoriteToDB(
    req.user as JwtPayload,
    req.params.id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Favorite updated successfully",
    data: favorite,
  });
});

const deleteFavorite = catchAsync(async (req: Request, res: Response) => {
  const favorite = await FavoriteServices.deleteFavoriteFromDB(
    req.user as JwtPayload,
    req.params.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Favorite deleted successfully",
    data: favorite,
  });
});

export const FavoriteController = {
  toggleFavorite,
  getMyFavorites,
  getFavoriteById,
  updateFavorite,
  deleteFavorite,
};
