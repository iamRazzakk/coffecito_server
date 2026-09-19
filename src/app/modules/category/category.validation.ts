import { z } from "zod";

const categoryZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    isActive: z.boolean().optional(),
  }),
});

const createCategoryZodSchema = z.object({
  body: categoryZodSchema.shape.body,
});

const updateCategoryZodSchema = z.object({
  body: categoryZodSchema.shape.body.partial(),
});

export const CategoryValidations = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
};
