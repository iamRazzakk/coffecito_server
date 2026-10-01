import { z } from "zod";
import { SUPPORT_TICKET_STATUS } from "./support.interface";

const createSupportTicketZodSchema = z.object({
  body: z.object({
    subject: z.string({ required_error: "Subject is required" }).trim().min(1),
    message: z.string({ required_error: "Message is required" }).trim().min(1),
  }),
});

const updateSupportTicketZodSchema = z.object({
  body: z.object({
    status: z.enum(SUPPORT_TICKET_STATUS, {
      required_error: "Status is required",
    }),
  }),
});

export const SupportValidations = {
  createSupportTicketZodSchema,
  updateSupportTicketZodSchema,
};
