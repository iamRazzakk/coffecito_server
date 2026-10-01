import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const createNotificationZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).trim().min(1),
    message: z.string({ required_error: "Message is required" }).trim().min(1),
    receiver: objectId,
  }),
});

const readManyNotificationsZodSchema = z.object({
  body: z.object({
    ids: z.array(objectId).min(1, "At least one id is required"),
  }),
});

export const NotificationValidations = {
  createNotificationZodSchema,
  readManyNotificationsZodSchema,
};
