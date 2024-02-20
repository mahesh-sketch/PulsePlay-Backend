import { Router } from "express";
import likeController from "../controllers/like.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(likeController.toggleVideoLike);
router.route("/toggle/c/:commentId").post(likeController.toggleCommentLike);
router.route("/toggle/t/:tweetId").post(likeController.toggleTweetLike);
router.route("/videos").get(likeController.getLikedVideos);
router.route("/videos/:videoId").get(likeController.getLikedByVideoId);

export default router;
