import { Router } from "express";
import userController from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userController.registerUser
);
userRouter.route("/login").post(userController.loginUser);

//secured routes
userRouter.route("/logout").post(verifyJwt, userController.logoutUser);

export default userRouter;
