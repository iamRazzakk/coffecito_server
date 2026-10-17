import { z } from "zod";
import { DISCOUNT_KINDS, OFFER_TYPES } from "./offer.constants";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
};

const numberField = z.preprocess((value) => {
  const next = emptyToUndefined(value);
  if (next === undefined) return undefined;
  if (typeof next === "string") return Number(next);
  return next;
}, z.number().min(0).optional());

const intField = z.preprocess((value) => {
  const next = emptyToUndefined(value);
  if (next === undefined) return undefined;
  if (typeof next === "string") return Number(next);
  return next;
}, z.number().int().min(1).optional());

const booleanField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const dateField = z.preprocess((value) => {
  const next = emptyToUndefined(value);
  if (next === undefined) return undefined;
  return next;
}, z.coerce.date().optional());

const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    const next = emptyToUndefined(value);
    if (typeof next !== "string") return next;
    try {
      return JSON.parse(next);
    } catch {
      return next;
    }
  }, schema.optional());

const offerBody = z.object({
  title: z.string({ required_error: "Title is required" }).min(1),
  description: z.string({ required_error: "Description is required" }).min(1),
  image: z.string({ required_error: "Image is required" }).min(1),
  offerType: z.enum(OFFER_TYPES, { required_error: "Offer type is required" }),
  shopId: z.string({ required_error: "Shop id is required" }),
  productIds: jsonArray(z.array(z.string())),
  isActive: booleanField,
  buyQuantity: intField,
  getQuantity: intField,
  percentOff: z.preprocess((value) => {
    const next = emptyToUndefined(value);
    if (next === undefined) return undefined;
    if (typeof next === "string") return Number(next);
    return next;
  }, z.number().min(0).max(100).optional()),
  maxDiscountAmount: numberField,
  minAmount: numberField,
  minQuantity: intField,
  discountType: z.enum(DISCOUNT_KINDS).optional(),
  discountValue: numberField,
  tiers: jsonArray(
    z.array(
      z.object({
        minAmount: z.number().min(0),
        discountType: z.enum(DISCOUNT_KINDS),
        discountValue: z.number().min(0),
      }),
    ),
  ),
  startAt: dateField,
  endAt: dateField,
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  days: jsonArray(z.array(z.number().int().min(0).max(6))),
  giftProductId: z.string().optional(),
  comboProductIds: jsonArray(z.array(z.string())),
  comboPrice: numberField,
});

const createOfferZodSchema = z.object({
  body: offerBody,
});

const updateOfferZodSchema = z.object({
  body: offerBody.partial(),
});

export const OfferValidations = {
  createOfferZodSchema,
  updateOfferZodSchema,
};
