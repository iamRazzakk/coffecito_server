import express from "express";
import { CouponCodeController } from "./coupon_code.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router
  .route("/")
  .post(auth(USER_ROLES.SUPER_ADMIN), CouponCodeController.createCouponCode)
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    CouponCodeController.getAllCouponCodes,
  );

router
  .route("/:id")
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    CouponCodeController.getCouponCodeById,
  )
  .put(auth(USER_ROLES.SUPER_ADMIN), CouponCodeController.updateCouponCode)
  .delete(auth(USER_ROLES.SUPER_ADMIN), CouponCodeController.deleteCouponCode);

export const CouponCodeRoutes = router;
