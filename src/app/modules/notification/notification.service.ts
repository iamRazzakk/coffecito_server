import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import QueryBuilder from "../../builder/queryBuilder";
import ApiError from "../../../errors/ApiErrors";
import { sendNotifications } from "../../../helpers/notificationsHelper";
import { User } from "../user/user.model";
import { Notification } from "./notification.model";

const createNotificationToDB = async (
  payload: { title: string; message: string; receiver: string },
  senderId: string,
) => {
  const receiver = await User.findById(payload.receiver).select("_id");
  if (!receiver) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Receiver not found");
  }

  return sendNotifications({
    title: payload.title,
    message: payload.message,
    receiver: receiver._id,
    sender: new Types.ObjectId(senderId),
  });
};

const getMyNotificationsFromDB = async (
  userId: string,
  query: Record<string, any>,
) => {
  const receiver = new Types.ObjectId(userId);
  const qb = new QueryBuilder(Notification.find({ receiver }), query)
    .filter()
    .sort()
    .paginate();

  const [meta, data, unreadCount] = await Promise.all([
    qb.getPaginationInfo(),
    qb.modelQuery.exec(),
    Notification.countDocuments({ receiver, isRead: false }),
  ]);
  return { meta, data, unreadCount };
};

const readNotificationFromDB = async (id: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, receiver: new Types.ObjectId(userId) },
    { isRead: true },
    { new: true },
  );
  if (!notification) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notification not found");
  }
  return notification;
};

const readManyNotificationsFromDB = async (ids: string[], userId: string) => {
  const result = await Notification.updateMany(
    {
      _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
      receiver: new Types.ObjectId(userId),
      isRead: false,
    },
    { isRead: true },
  );
  return { modifiedCount: result.modifiedCount };
};

export const NotificationServices = {
  createNotificationToDB,
  getMyNotificationsFromDB,
  readNotificationFromDB,
  readManyNotificationsFromDB,
};
