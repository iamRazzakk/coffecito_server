import express from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { FavoriteController } from "./favorite.controller";
import { FavoriteValidations } from "./favorite.validation";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.USER, USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
    validateRequest(FavoriteValidations.toggleFavoriteZodSchema),
    FavoriteController.toggleFavorite,
  )
  .get(
    auth(USER_ROLES.USER, USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
    validateRequest(FavoriteValidations.getFavoritesZodSchema),
    FavoriteController.getMyFavorites,
  );

router
  .route("/:id")
  .get(
    auth(USER_ROLES.USER, USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
    validateRequest(FavoriteValidations.favoriteIdZodSchema),
    FavoriteController.getFavoriteById,
  )
  .patch(
    auth(USER_ROLES.USER, USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
    validateRequest(FavoriteValidations.updateFavoriteZodSchema),
    FavoriteController.updateFavorite,
  )
  .delete(
    auth(USER_ROLES.USER, USER_ROLES.SHOP_OWNER, USER_ROLES.SUPER_ADMIN),
    validateRequest(FavoriteValidations.favoriteIdZodSchema),
    FavoriteController.deleteFavorite,
  );

export const FavoriteRoutes = router;
