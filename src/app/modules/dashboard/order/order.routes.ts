import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { OrderController } from "./order.controller";

const router = express.Router();

router.get(
  "/order",
  auth(USER_ROLES.SUPER_ADMIN),
  OrderController.getAllOrders,
);
router.get(
  "/order/overview",
  auth(USER_ROLES.SUPER_ADMIN),
  OrderController.getOrderOverview,
);

export const OrderRoutes = router;
