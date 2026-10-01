import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { ReportController } from "./report.controller";

const router = express.Router();

router.get("/", auth(USER_ROLES.SUPER_ADMIN), ReportController.getReport);

export const ReportRoutes = router;
