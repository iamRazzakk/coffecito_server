import express, { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import {
  getSingleFilePath,
  getUploadFields,
} from "../../middlewares/fileUploaderHandlar";
import ApiError from "../../../errors/ApiErrors";
import { USER_ROLES } from "../../../enums/user";
import { ShopController } from "./shop.controller";
import { ShopValidations } from "./shop.validation";

const parseShopFormData = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const raw = req.body?.data;
    if (!raw || typeof raw !== "string") {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Data is required");
    }

    const data = JSON.parse(raw);
    const image = getSingleFilePath(
      req.files as Record<string, Express.Multer.File[]>,
      "image",
    );
    if (image) {
      data.image = image;
    }
    req.body = data;
    next();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return next(
        new ApiError(StatusCodes.BAD_REQUEST, "Data must be valid JSON"),
      );
    }
    next(error);
  }
};

const router = express.Router();

router
  .route("/")
  .post(
    getUploadFields(),
    auth(USER_ROLES.SUPER_ADMIN),
    parseShopFormData,
    validateRequest(ShopValidations.createShopZodSchema),
    ShopController.createShop,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ShopController.getAllShops,
  );

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ShopController.getShopById,
  )
  .patch(
    getUploadFields(),
    auth(USER_ROLES.SUPER_ADMIN),
    parseShopFormData,
    validateRequest(ShopValidations.updateShopZodSchema),
    ShopController.updateShopById,
  )
  .delete(auth(USER_ROLES.SUPER_ADMIN), ShopController.deleteShopById);

export const ShopRoutes = router;
