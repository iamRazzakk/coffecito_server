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
import { GiftController } from "./gift.controller";
import { GiftValidations } from "./gift.validation";

const router = express.Router();

const attachGiftImage =
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
    auth(USER_ROLES.SUPER_ADMIN),
    getUploadFields(),
    attachGiftImage(true),
    validateRequest(GiftValidations.createGiftZodSchema),
    GiftController.createGift,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER, USER_ROLES.USER),
    GiftController.getAllGifts,
  );

router.post(
  "/:id/claim",
  auth(USER_ROLES.USER),
  GiftController.claimGift,
);

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.SHOP_OWNER, USER_ROLES.USER),
    GiftController.getGiftById,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN),
    getUploadFields(),
    attachGiftImage(false),
    validateRequest(GiftValidations.updateGiftZodSchema),
    GiftController.updateGiftById,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN),
    GiftController.deleteGiftById,
  );

export const GiftRoutes = router;
