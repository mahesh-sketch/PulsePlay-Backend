import { Router } from "express";
import videoController from "../controllers/video.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").get(verifyJWT, videoController.getAllVideos);

router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbNail",
      maxCount: 1,
    },
  ]),
  videoController.uploadVideo
);

router
  .route("/:videoId")
  .get(videoController.getVideoById)
  .delete(videoController.deleteVideo)
  .patch(upload.single("thumbnail"), videoController.updateVideo);

router
  .route("/toggle/publish/:videoId")
  .patch(videoController.togglePublishStatus);

export default router;
