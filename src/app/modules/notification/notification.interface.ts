import { Model, Types } from "mongoose";

export type INotification = {
  title: string;
  message: string;
  receiver: Types.ObjectId;
  sender?: Types.ObjectId;
  isRead: boolean;
};

export type NotificationModel = Model<INotification>;
