import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { NotificationServices } from "./notification.service";

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.createNotificationToDB(
    req.body,
    req.user.id,
  );
  sendResponse(res, {
    success: true,
    message: "Notification created successfully",
    statusCode: StatusCodes.CREATED,
    data: result,
  });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.getMyNotificationsFromDB(
    req.user.id,
    req.query,
  );
  sendResponse(res, {
    success: true,
    message: "Notifications fetched successfully",
    statusCode: StatusCodes.OK,
    pagination: result.meta,
    data: { unreadCount: result.unreadCount, notifications: result.data },
  });
});

const readNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.readNotificationFromDB(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    success: true,
    message: "Notification marked as read",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const readManyNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationServices.readManyNotificationsFromDB(
      req.body.ids,
      req.user.id,
    );
    sendResponse(res, {
      success: true,
      message: "Notifications marked as read",
      statusCode: StatusCodes.OK,
      data: result,
    });
  },
);

export const NotificationController = {
  createNotification,
  getMyNotifications,
  readNotification,
  readManyNotifications,
};
