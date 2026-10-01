import express, { NextFunction, Request, Response } from "express";
import { CategoryController } from "./category.controller";
import validateRequest from "../../middlewares/validateRequest";
import { CategoryValidations } from "./category.validation";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import {
  getSingleFilePath,
  getUploadFields,
} from "../../middlewares/fileUploaderHandlar";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";

const router = express.Router();
router
  .route("/")
  .post(
    getUploadFields(),
    auth(USER_ROLES.SUPER_ADMIN),
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const data = req.body;
        const image = getSingleFilePath(
          req.files as Record<string, Express.Multer.File[]>,
          "image",
        );
        if (!image) {
          throw new ApiError(StatusCodes.BAD_REQUEST, "Image is required");
        }
        data.image = image;
        req.body = data;
        next();
      } catch (error) {
        next(error);
      }
    },
    validateRequest(CategoryValidations.createCategoryZodSchema),
    CategoryController.createCategory,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    CategoryController.getAllCategories,
  );
router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    CategoryController.getCategoryById,
  )
  .patch(
    validateRequest(CategoryValidations.updateCategoryZodSchema),
    auth(USER_ROLES.SUPER_ADMIN),
    CategoryController.updateCategoryById,
  )
  .delete(auth(USER_ROLES.SUPER_ADMIN), CategoryController.deleteCategoryById);

export const CategoryRoutes = router;
