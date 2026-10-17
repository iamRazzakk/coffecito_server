import { z } from "zod";

const objectId = z
  .string({ required_error: "Id is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const requiredNumber = (message: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() !== "") return Number(value);
      return value;
    },
    z
      .number({ required_error: message, invalid_type_error: message })
      .min(0),
  );

const optionalNumber = z.preprocess((value) => {
  const next = emptyToUndefined(value);
  if (next === undefined) return undefined;
  if (typeof next === "string") return Number(next);
  return next;
}, z.number().min(0).optional());

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const parseJson = (value: unknown) => {
  const next = emptyToUndefined(value);
  if (typeof next !== "string") return next;
  try {
    return JSON.parse(next);
  } catch {
    return next;
  }
};

const productSizeSchema = z.object({
  name: z.enum(["S", "M", "L"], { required_error: "Size name is required" }),
  additionalPrice: requiredNumber("Additional price is required"),
});

const productExtraSchema = z.object({
  name: z.string().optional(),
  additionalPrice: optionalNumber,
});

const productZodSchema = z.object({
  productName: z
    .string({ required_error: "Product name is required" })
    .trim()
    .min(1),
  categoryId: objectId,
  description: z.string().optional(),
  image: z.string({ required_error: "Image is required" }).min(1),
  originalPrice: requiredNumber("Original price is required"),
  discountPrice: optionalNumber,
  costPrice: optionalNumber,
  sizes: z.preprocess(parseJson, z.array(productSizeSchema).optional()),
  extras: z.preprocess(parseJson, z.array(productExtraSchema).optional()),
  status: optionalBoolean,
  taxPercentage: optionalNumber,
  point: optionalNumber,
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
