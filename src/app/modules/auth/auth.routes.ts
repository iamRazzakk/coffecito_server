import express, { NextFunction, Request, Response } from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { authLimiter } from "../../../services/rate-limiter";
// import passport from '../../../config/passport'
const router = express.Router();

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser,
);

router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword,
);

router.post("/refresh-token", authLimiter, AuthController.newAccessToken);

router.post(
  "/resend-otp",
  authLimiter,
  validateRequest(AuthValidation.createResendOtpZodSchema),
  AuthController.resendVerificationPhone,
);

router.post(
  "/verify-phone",
  authLimiter,
  validateRequest(AuthValidation.createVerifyPhoneZodSchema),
  AuthController.verifyPhone,
);

router.post(
  "/reset-password",
  authLimiter,
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword,
);

router.post(
  "/change-password",
  authLimiter,
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword,
);

router.delete(
  "/delete-account",
  auth(USER_ROLES.SUPER_ADMIN),
  AuthController.deleteUser,
);

export const AuthRoutes = router;
