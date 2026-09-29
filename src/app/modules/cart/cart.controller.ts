import { Request, Response, NextFunction } from "express";
import { CartServices } from "./cart.service";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../../shared/catchAsync";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../../shared/sendResponse";

const createCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const cartItem = await CartServices.createCartInToDB(req.body, user);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Cart item created successfully",
      data: cartItem,
    });
  },
);

const getAllCartItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtPayload;
    const query = req.query;
    const cartItems = await CartServices.getAllCartItemsFromDB(user, query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Cart items fetched successfully",
      pagination: cartItems.meta,
      data: cartItems.data,
    });
  },
);

const updateCartItemQuantity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const user = req.user as JwtPayload;
    const cartItem = await CartServices.updateCartItemQuantityFromDB(
      id,
      quantity,
      user,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Cart item quantity updated successfully",
      data: cartItem,
    });
  },
);

export const CartController = {
  createCart,
  getAllCartItems,
  updateCartItemQuantity,
};
