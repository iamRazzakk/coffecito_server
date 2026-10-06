import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { UserListService } from "./userList.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserListService.getAllUsersFromDB(req.query);
  sendResponse(res, {
    success: true,
    message: "Users fetched successfully",
    statusCode: StatusCodes.OK,
    pagination: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserListService.getUserByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    message: "User fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserListService.suspendUserByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    message: "User suspended successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const restoreUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserListService.restoreUserByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    message: "User access restored successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const UserListController = {
  getAllUsers,
  getUserById,
  suspendUser,
  restoreUser,
};
