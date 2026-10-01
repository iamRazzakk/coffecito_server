import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import QueryBuilder from "../../../builder/queryBuilder";
import ApiError from "../../../../errors/ApiErrors";
import { ISupportTicket } from "./support.interface";
import { SupportTicket } from "./support.model";
import { JwtPayload } from "jsonwebtoken";

const USER_FIELDS = "name phone";

const createSupportTicketToDB = async (
  payload: ISupportTicket,
  user: JwtPayload,
) => {
  payload.user = user.id;
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  payload.ticketId = `TK-${randomNumber}`;
  const data = await SupportTicket.create(payload);
  if (!data) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to create support ticket",
    );
  }
  return data;
};

const getAllSupportTicketsFromDB = async (query: Record<string, any>) => {
  const listQuery = { ...query };
  if (listQuery.status === "All" || listQuery.status === "all") {
    delete listQuery.status;
  }

  const qb = new QueryBuilder(SupportTicket.find(), listQuery)
    .search(["ticketId"])
    .filter()
    .sort()
    .paginate()
    .populate(["user"], { user: USER_FIELDS });
  const [meta, data] = await Promise.all([
    qb.getPaginationInfo(),
    qb.modelQuery.exec(),
  ]);
  return { meta, data };
};

const getSupportTicketByIdFromDB = async (id: string) => {
  const data = await SupportTicket.findById(id).populate("user", USER_FIELDS);
  if (!data) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Support ticket not found");
  }
  return data;
};

const updateSupportTicketStatusToDB = async (
  id: string,
  payload: Partial<ISupportTicket>,
) => {
  const data = await SupportTicket.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!data) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Support ticket not found");
  }
  return data;
};

export const SupportServices = {
  createSupportTicketToDB,
  getAllSupportTicketsFromDB,
  getSupportTicketByIdFromDB,
  updateSupportTicketStatusToDB,
};
