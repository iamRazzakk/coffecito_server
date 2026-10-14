import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CartServices } from "./cart.service";

const createCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await CartServices.createCartInToDB(req.body, user);
  sendResponse(res, {
    statusCode: result.created ? StatusCodes.CREATED : StatusCodes.OK,
    success: true,
    message: result.created
      ? "Product added to cart"
      : "Cart quantity updated",
    data: result.cart,
  });
});

const getAllCartItems = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const cartItems = await CartServices.getAllCartItemsFromDB(user, req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cart items fetched successfully",
    pagination: cartItems.meta,
    data: {
      items: cartItems.data,
      subtotal: cartItems.subtotal,
    },
  });
});

const updateCartItemQuantity = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await CartServices.updateCartItemQuantityFromDB(
      req.params.id,
      req.body,
      user,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.removed
        ? "Cart item removed"
        : "Cart item quantity updated successfully",
      data: result.cart,
    });
  },
);

const deleteCartItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const cartItem = await CartServices.deleteCartItemFromDB(req.params.id, user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cart item deleted successfully",
    data: cartItem,
  });
});

export const CartController = {
  createCart,
  getAllCartItems,
  updateCartItemQuantity,
  deleteCartItem,
};
