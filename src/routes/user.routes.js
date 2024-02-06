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
userRouter.route("/refresh-token").post(userController.refreshAccessToken);
userRouter
  .route("/change-password")
  .post(verifyJwt, upload.none(), userController.changeCurrentPassword);
userRouter
  .route("/get-current-user")
  .get(verifyJwt, userController.getCurrentUser);
userRouter
  .route("/update-account-details")
  .post(verifyJwt, upload.none(), userController.updateAccountDetails);
userRouter
  .route("/update-user-avatar")
  .post(verifyJwt,upload.single("avatar"),userController.updateUserAvatar);
export default userRouter;
