import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { OverviewServices } from "./overview.service";

const getOverViewData = catchAsync(async (_req: Request, res: Response) => {
  const result = await OverviewServices.getOverViewDataFromDB();
  sendResponse(res, {
    success: true,
    message: "Overview fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getRevenueByMonth = catchAsync(async (_req: Request, res: Response) => {
  const result = await OverviewServices.getRevenueOverViewBaseTheMonth();
  sendResponse(res, {
    success: true,
    message: "Monthly revenue fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getPurchaseOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await OverviewServices.getPurchaseOverviewFromDB();
  sendResponse(res, {
    success: true,
    message: "Purchase overview fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getTopSellingProducts = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await OverviewServices.heightSellingProductFromDB();
    sendResponse(res, {
      success: true,
      message: "Top selling products fetched successfully",
      statusCode: StatusCodes.OK,
      data: result,
    });
  },
);

const getRevenueSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await OverviewServices.getRevinewFromAllAndCurrentMonth();
  sendResponse(res, {
    success: true,
    message: "Revenue summary fetched successfully",
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const OverviewController = {
  getOverViewData,
  getRevenueByMonth,
  getPurchaseOverview,
  getTopSellingProducts,
  getRevenueSummary,
};
