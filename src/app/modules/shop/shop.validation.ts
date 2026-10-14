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

const objectIdSchema = z
  .string({ required_error: "Id is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const shopCategoryProductsZodSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    categoryId: objectIdSchema,
  }),
});

export const ShopValidations = {
  createShopZodSchema,
  updateShopZodSchema,
  shopCategoryProductsZodSchema,
};
