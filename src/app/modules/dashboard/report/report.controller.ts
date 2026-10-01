import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { ReportServices } from "./report.service";

const getReport = catchAsync(async (_req: Request, res: Response) => {
  const result = await ReportServices.getReportFromDB();
  sendResponse(res, {
    success: true,
    message: "Report fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const ReportController = { getReport };
