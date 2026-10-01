import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { OverviewController } from "./overview.controller";

const router = express.Router();

router.get(
  "/overview",
  auth(USER_ROLES.SUPER_ADMIN),
  OverviewController.getOverViewData,
);
router.get(
  "/revenue-by-month",
  auth(USER_ROLES.SUPER_ADMIN),
  OverviewController.getRevenueByMonth,
);
router.get(
  "/purchases",
  auth(USER_ROLES.SUPER_ADMIN),
  OverviewController.getPurchaseOverview,
);
router.get(
  "/top-products",
  auth(USER_ROLES.SUPER_ADMIN),
  OverviewController.getTopSellingProducts,
);
router.get(
  "/revenue-summary",
  auth(USER_ROLES.SUPER_ADMIN),
  OverviewController.getRevenueSummary,
);

export const OverviewRoutes = router;
