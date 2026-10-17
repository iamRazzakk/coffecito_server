import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { OfferServices } from "./offer.service";

const createOffer = catchAsync(async (req: Request, res: Response) => {
  const offer = await OfferServices.createOfferToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Offer created successfully",
    data: offer,
  });
});

const getAllOffers = catchAsync(async (req: Request, res: Response) => {
  const offers = await OfferServices.getAllOffersFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Offers fetched successfully",
    data: offers,
  });
});

const getOfferById = catchAsync(async (req: Request, res: Response) => {
  const offer = await OfferServices.getOfferByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Offer fetched successfully",
    data: offer,
  });
});

const updateOfferById = catchAsync(async (req: Request, res: Response) => {
  const offer = await OfferServices.updateOfferByIdToDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Offer updated successfully",
    data: offer,
  });
});

const deleteOfferById = catchAsync(async (req: Request, res: Response) => {
  const offer = await OfferServices.deleteOfferByIdFromDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Offer deleted successfully",
    data: offer,
  });
});

const getAllActiveOffers = catchAsync(async (req: Request, res: Response) => {
  const offers = await OfferServices.getAllActiveOffersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Active offers fetched successfully",
    data: offers,
  });
});

export const OfferController = {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOfferById,
  deleteOfferById,
  getAllActiveOffers,
};
