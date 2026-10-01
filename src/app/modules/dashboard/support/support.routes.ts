import express from "express";
import auth from "../../../middlewares/auth";
import validateRequest from "../../../middlewares/validateRequest";
import { USER_ROLES } from "../../../../enums/user";
import { SupportController } from "./support.controller";
import { SupportValidations } from "./support.validation";

const router = express.Router();

router
  .route("/")
  .post(
    auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
    validateRequest(SupportValidations.createSupportTicketZodSchema),
    SupportController.createSupportTicket,
  )
  .get(auth(USER_ROLES.SUPER_ADMIN), SupportController.getAllSupportTickets);

router.get(
  "/:id",
  auth(USER_ROLES.SUPER_ADMIN),
  SupportController.getSupportTicketById,
);
router.patch(
  "/:id",
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SupportValidations.updateSupportTicketZodSchema),
  SupportController.updateSupportTicketStatus,
);

export const SupportRoutes = router;
