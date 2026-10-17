import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { USER_ROLES } from "../../../enums/user";
import ApiError from "../../../errors/ApiErrors";
import auth from "../../middlewares/auth";
import {
  getSingleFilePath,
  getUploadFields,
} from "../../middlewares/fileUploaderHandlar";
import validateRequest from "../../middlewares/validateRequest";
import { OfferController } from "./offer.controller";
import { OfferValidations } from "./offer.validation";

const router = express.Router();

const attachOfferImage =
  (required: boolean) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const image = getSingleFilePath(
        (req.files ?? {}) as Record<string, Express.Multer.File[]>,
        "image",
      );
      if (required && !image) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Image is required");
      }
      if (image) req.body.image = image;
      next();
    } catch (error) {
      next(error);
    }
  };

router
  .route("/")
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER),
    getUploadFields(),
    attachOfferImage(true),
    validateRequest(OfferValidations.createOfferZodSchema),
    OfferController.createOffer,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER, USER_ROLES.USER),
    OfferController.getAllOffers,
  );

router
  .route("/active")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER, USER_ROLES.USER),
    OfferController.getAllActiveOffers,
  );

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER, USER_ROLES.USER),
    OfferController.getOfferById,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER),
    getUploadFields(),
    attachOfferImage(false),
    validateRequest(OfferValidations.updateOfferZodSchema),
    OfferController.updateOfferById,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER),
    OfferController.deleteOfferById,
  );

export const OfferRoutes = router;
