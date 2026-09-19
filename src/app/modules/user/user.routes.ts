import express, { NextFunction, Request, Response } from "express";
import { USER_ROLES } from "../../../enums/user";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import {
  getSingleFilePath,
  getUploadFields,
} from "../../middlewares/fileUploaderHandlar";

const router = express.Router();

router.get(
  "/profile",
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  UserController.getUserProfile,
);

router
  .route("/")
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
    getUploadFields(),
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const data = req.body;
        const profilePath = getSingleFilePath(
          req.files as Record<string, Express.Multer.File[]>,
          "image",
        );
        if (profilePath) {
          data.image = profilePath;
        }
        // need to parse the body
        const parsedBody = JSON.parse(data);
        req.body = parsedBody;
        next();
      } catch (error) {
        next(error);
      }
    },
    UserController.updateProfile,
  );
export const UserRoutes = router;
