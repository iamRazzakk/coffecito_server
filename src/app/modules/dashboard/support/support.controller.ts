import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { SupportServices } from "./support.service";

const createSupportTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportServices.createSupportTicketToDB(
    req.body,
    req.user,
  );
  sendResponse(res, {
    success: true,
    message: "Support ticket created successfully",
    statusCode: StatusCodes.CREATED,
    data: result,
  });
});

const getAllSupportTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportServices.getAllSupportTicketsFromDB(req.query);
  sendResponse(res, {
    success: true,
    message: "Support tickets fetched successfully",
    statusCode: StatusCodes.OK,
    pagination: result.meta,
    data: result.data,
  });
});

const getSupportTicketById = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportServices.getSupportTicketByIdFromDB(
    req.params.id,
  );
  sendResponse(res, {
    success: true,
    message: "Support ticket fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const updateSupportTicketStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SupportServices.updateSupportTicketStatusToDB(
      req.params.id,
      req.body.status,
    );
    sendResponse(res, {
      success: true,
      message: "Support ticket updated successfully",
      statusCode: StatusCodes.OK,
      data: result,
    });
  },
);

export const SupportController = {
  createSupportTicket,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
};
