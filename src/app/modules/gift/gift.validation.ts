import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const asNumber = (value: unknown) => {
  const next = emptyToUndefined(value);
  if (next === undefined) return undefined;
  if (typeof next === "string") return Number(next);
  return next;
};

const requiredInt = (label: string, min: number, max?: number) =>
  z.preprocess((value) => asNumber(value), (() => {
    let schema = z
      .number({ required_error: `${label} is required` })
      .int()
      .min(min, `${label} must be at least ${min}`);
    if (max != null) {
      schema = schema.max(max, `${label} must be at most ${max}`);
    }
    return schema;
  })());

const optionalInt = (min: number, max?: number) =>
  z.preprocess((value) => asNumber(value), (() => {
    let schema = z.number().int().min(min);
    if (max != null) schema = schema.max(max);
    return schema.optional();
  })());

const dateField = z.preprocess((value) => {
  const next = emptyToUndefined(value);
  if (next === undefined) return undefined;
  return next;
}, z.coerce.date().optional());

const giftBody = z.object({
  image: z.string({ required_error: "Image is required" }).min(1),
  minPoints: requiredInt("Minimum points", 0),
  description: z.string({ required_error: "Description is required" }).min(1),
  createDate: dateField,
  availableDays: requiredInt("Available days", 1),
  collectLocation: z
    .string({ required_error: "Collect location is required" })
    .min(1),
});

const createGiftZodSchema = z.object({
  body: giftBody,
});

const updateGiftZodSchema = z.object({
  body: giftBody.partial().extend({
    minPoints: optionalInt(0),
    availableDays: optionalInt(1),
  }),
});

export const GiftValidations = {
  createGiftZodSchema,
  updateGiftZodSchema,
};
