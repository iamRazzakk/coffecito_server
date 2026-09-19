import { z } from "zod";

const productZodSchema = z.object({
  productName: z.string({ required_error: "Product name is required" }),
  categoryId: z.string({ required_error: "Category id is required" }),
  size: z.enum(["S", "M", "L"], { required_error: "Size is required" }),
  description: z.string({ required_error: "Description is required" }),
  discountPrice: z.number({ required_error: "Discount price is required" }),
  originalPrice: z.number({ required_error: "Original price is required" }),
  image: z.string({ required_error: "Image is required" }).optional(),
  status: z.boolean().optional(),
});

const createProductZodSchema = z.object({
  body: productZodSchema,
});

const updateProductZodSchema = z.object({
  body: productZodSchema.partial(),
});

export const ProductValidations = {
  createProductZodSchema,
  updateProductZodSchema,
};
