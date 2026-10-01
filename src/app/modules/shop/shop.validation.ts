import { z } from "zod";
import { SHOP_DAYS, SHOP_STATUS } from "./shop.constants";

const faqZodSchema = z.object({
  question: z.string({ required_error: "Question is required" }).trim().min(1),
  answer: z.string({ required_error: "Answer is required" }).trim().min(1),
});

const hoursZodSchema = z.object({
  day: z.enum(SHOP_DAYS, { required_error: "Day is required" }),
  open: z.string({ required_error: "Open time is required" }).trim().min(1),
  close: z.string({ required_error: "Close time is required" }).trim().min(1),
});

const shopZodSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(1),
  location: z.string({ required_error: "Location is required" }).trim().min(1),
  phone: z.string().trim().optional(),
  about: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(SHOP_STATUS).optional(),
  faqs: z.array(faqZodSchema).optional(),
  hours: z.array(hoursZodSchema).optional(),
});

const createShopZodSchema = z.object({
  body: shopZodSchema,
});

const updateShopZodSchema = z.object({
  body: shopZodSchema.partial(),
});

export const ShopValidations = {
  createShopZodSchema,
  updateShopZodSchema,
};
