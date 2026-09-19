import express from "express";
import { CategoryController } from "./category.controller";
import validateRequest from "../../middlewares/validateRequest";
import { CategoryValidations } from "./category.validation";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();
router
  .route("/")
  .post(
    validateRequest(CategoryValidations.createCategoryZodSchema),
    auth(USER_ROLES.SUPER_ADMIN),
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
