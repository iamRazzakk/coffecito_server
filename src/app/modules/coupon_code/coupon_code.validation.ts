import { z } from "zod";

export const CouponCodeValidations = z.object({
  percentage: z.number({ required_error: "Percentage is required" }),
  code: z.number({ required_error: "Code is required" }),
  expireDate: z.date({ required_error: "Expire date is required" }),
  isActive: z.boolean({ required_error: "Is active is required" }).optional(),
});

const CouponCodeValidationSchema = z.object({
  body: CouponCodeValidations,
});

export const CouponCodeValidation = {
  create: CouponCodeValidationSchema,
};
