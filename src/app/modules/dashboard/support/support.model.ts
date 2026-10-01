import { Schema, model } from "mongoose";
import {
  ISupportTicket,
  SUPPORT_TICKET_STATUS,
  SupportTicketModel,
} from "./support.interface";

const supportTicketSchema = new Schema<ISupportTicket, SupportTicketModel>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [...SUPPORT_TICKET_STATUS],
      default: "Pending",
    },
  },
  { timestamps: true },
);

export const SupportTicket = model<ISupportTicket, SupportTicketModel>(
  "SupportTicket",
  supportTicketSchema,
);
