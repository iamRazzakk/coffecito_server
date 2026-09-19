import { z } from "zod";
const CartValidationSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }),
    quantity: z.number({ required_error: "Quantity is required" }),
    userId: z.string({ required_error: "User ID is required" }).optional(),
    size: z.enum(["S", "M", "L"], { required_error: "Size is required" }),
  }),
});

const createCartValidationSchema = z.object({
  body: CartValidationSchema.shape.body,
});

const updateCartItemQuantityValidationSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }),
  }),
  body: CartValidationSchema.optional(),
});

export const CartValidations = {
  createCartValidationSchema,
  updateCartItemQuantityValidationSchema,
};
