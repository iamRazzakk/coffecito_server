import express from "express";
import { CartController } from "./cart.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import validateRequest from "../../middlewares/validateRequest";
import { CartValidations } from "./cart.validation";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
    validateRequest(CartValidations.createCartValidationSchema),
    CartController.createCart,
  )
  .get(
    auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
    CartController.getAllCartItems,
  );
router
  .route("/:id")
  .patch(
    auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
    validateRequest(CartValidations.updateCartItemQuantityValidationSchema),
    CartController.updateCartItemQuantity,
  );
export const CartRoutes = router;
