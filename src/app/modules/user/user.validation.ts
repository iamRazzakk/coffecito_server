import { z } from "zod";
import { USER_ROLES } from "../../../enums/user";

const createAdminZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
    role: z.enum(Object.values(USER_ROLES) as [string, ...string[]], {
      required_error: "Role is required",
    }),
  }),
});

const createUserZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" }),
    role: z.enum(Object.values(USER_ROLES) as [string, ...string[]], {
      required_error: "Role is required",
    }).optional(),
  }),
});

export const UserValidation = { createAdminZodSchema, createUserZodSchema };
