import express from "express";
import auth from "../../../middlewares/auth";
import { USER_ROLES } from "../../../../enums/user";
import { UserListController } from "./userList.controller";

const router = express.Router();

router.get(
  "/",
  auth(USER_ROLES.SUPER_ADMIN),
  UserListController.getAllUsers,
);
router.get(
  "/:id",
  auth(USER_ROLES.SUPER_ADMIN),
  UserListController.getUserById,
);
router.patch(
  "/:id/suspend",
  auth(USER_ROLES.SUPER_ADMIN),
  UserListController.suspendUser,
);

export const UserListRoutes = router;
