import { z } from "zod";
import { checkValidID } from "../../../shared/checkValidID";

const createCartValidationSchema = z.object({
  body: z.object({
    productId: checkValidID("Product ID is required"),
    size: z.enum(["S", "M", "L"], { required_error: "Size is required" }),
    extras: z.array(z.string().min(1)).optional(),
    quantity: z
      .number({ required_error: "Quantity is required" })
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .optional(),
  }),
});

const updateCartItemQuantityValidationSchema = z.object({
  params: z.object({
    id: checkValidID("Cart item id is required"),
  }),
  body: z
    .object({
      action: z.enum(["increment", "decrement"]).optional(),
      quantity: z
        .number({ required_error: "Quantity is required" })
        .int("Quantity must be a whole number")
        .min(1, "Quantity must be at least 1")
        .optional(),
    })
    .refine((value) => Boolean(value.action || value.quantity), {
      message: "Send an action or a quantity",
    }),
});

const deleteCartItemValidationSchema = z.object({
  params: z.object({
    id: checkValidID("Cart item id is required"),
  }),
});

export const CartValidations = {
  createCartValidationSchema,
  updateCartItemQuantityValidationSchema,
  deleteCartItemValidationSchema,
};
