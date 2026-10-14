import { z } from "zod";

const objectIdSchema = z
  .string({ required_error: "Id is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const favoriteTargetSchema = z
  .object({
    shopId: objectIdSchema.optional(),
    productId: objectIdSchema.optional(),
  })
  .refine((data) => Boolean(data.shopId) !== Boolean(data.productId), {
    message: "Provide either shopId or productId",
  });

const toggleFavoriteZodSchema = z.object({
  body: favoriteTargetSchema,
});

const updateFavoriteZodSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: favoriteTargetSchema,
});

const getFavoritesZodSchema = z.object({
  query: z.object({
    type: z.enum(["shop", "product"]).optional(),
  }),
});

const favoriteIdZodSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const FavoriteValidations = {
  toggleFavoriteZodSchema,
  getFavoritesZodSchema,
  updateFavoriteZodSchema,
  favoriteIdZodSchema,
};
