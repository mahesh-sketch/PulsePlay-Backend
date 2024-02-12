import { Router } from "express";
import userController from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import verifyJwt from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
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
router.route("/login").post(userController.loginUser);

//secured routes
router.route("/logout").post(verifyJwt, userController.logoutUser);
router.route("/refresh-token").post(userController.refreshAccessToken);

router
  .route("/change-password")
  .post(verifyJwt, upload.none(), userController.changeCurrentPassword);

router
  .route("/get-current-user")
  .get(verifyJwt, userController.getCurrentUser);

router
  .route("/update-account-details")
  .post(verifyJwt, upload.none(), userController.updateAccountDetails);

router
  .route("/update-user-avatar")
  .patch(verifyJwt, upload.single("avatar"), userController.updateUserAvatar);

router
  .route("/update-cover-image")
  .patch(
    verifyJwt,
    upload.single("coverImage"),
    userController.updateUserCoverImage
  );

router
  .route("/c/:username")
  .get(verifyJwt, userController.getUserChannelProfile);

router
  .route("/watch-history")
  .get(verifyJwt, userController.getWatchHistory);

router
  .route("/add-to-watch-history/:videoId")
  .post(verifyJwt, userController.addtoWatchHistory);

export default router;
