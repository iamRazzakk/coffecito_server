import express from "express";
import { PurchaseController } from "./purchase.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router
  .route("/")
  .post(auth(USER_ROLES.USER), PurchaseController.createPurchase);

export const PurchaseRoutes = router;
