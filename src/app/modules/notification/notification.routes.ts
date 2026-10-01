import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLES } from "../../../enums/user";
import { NotificationController } from "./notification.controller";
import { NotificationValidations } from "./notification.validation";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.SUPER_ADMIN),
    validateRequest(NotificationValidations.createNotificationZodSchema),
    NotificationController.createNotification,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    NotificationController.getMyNotifications,
  );

router.patch(
  "/read",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  validateRequest(NotificationValidations.readManyNotificationsZodSchema),
  NotificationController.readManyNotifications,
);

router.patch(
  "/:id/read",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  NotificationController.readNotification,
);

export const NotificationRoutes = router;
