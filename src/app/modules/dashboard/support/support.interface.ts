import { Model, Types } from "mongoose";

export const SUPPORT_TICKET_STATUS = ["Pending", "Resolved", "Closed"] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUS)[number];

export type ISupportTicket = {
  ticketId: string;
  user: Types.ObjectId;
  subject: string;
  message: string;
  status: SupportTicketStatus;
};

export type SupportTicketModel = Model<ISupportTicket>;
