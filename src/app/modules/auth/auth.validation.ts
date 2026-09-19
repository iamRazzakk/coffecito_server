import { z } from "zod";

const createVerifyPhoneZodSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
    oneTimeCode: z.number({ required_error: "One time code is required" }),
  }),
});

const createLoginZodSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
  }),
});

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
  }),
});

const createResendOtpZodSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
  }),
});

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string({ required_error: "Password is required" }),
    confirmPassword: z.string({
      required_error: "Confirm Password is required",
    }),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: "Current Password is required",
    }),
    newPassword: z.string({ required_error: "New Password is required" }),
    confirmPassword: z.string({
      required_error: "Confirm Password is required",
    }),
  }),
});

export const AuthValidation = {
  createVerifyPhoneZodSchema,
  createForgetPasswordZodSchema,
  createLoginZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
  createResendOtpZodSchema,
};
