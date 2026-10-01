import express, { NextFunction, Response } from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ProductController } from "./product.controller";
import { ProductValidations } from "./product.validation";
import { Request } from "express";
import {
  getSingleFilePath,
  getUploadFields,
} from "../../middlewares/fileUploaderHandlar";
import { Product } from "./product.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.SUPER_ADMIN),
    getUploadFields(),

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = req.body;
        data.originalPrice = Number(data.originalPrice);
        data.discountPrice = Number(data.discountPrice);
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
    validateRequest(ProductValidations.createProductZodSchema),
    ProductController.createProduct,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ProductController.getAllProducts,
  );

router
  .route("/filter-by-status/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ProductController.getAllProductsFilterByStatus,
  );

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    ProductController.getProductById,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN),
    getUploadFields(),
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const data = req.body;
        data.originalPrice = Number(data.originalPrice);
        data.discountPrice = Number(data.discountPrice);
        const image = getSingleFilePath(
          req.files as Record<string, Express.Multer.File[]>,
          "image",
        );
        data.image = image;
        req.body = data;

        next();
      } catch (error) {
        next(error);
      }
    },
    validateRequest(ProductValidations.updateProductZodSchema),
    ProductController.updateProductById,
  )
  .delete(auth(USER_ROLES.SUPER_ADMIN), ProductController.deleteProductById);

export const ProductRoutes = router;
