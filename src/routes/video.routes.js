import { Router } from "express";
import videoController from "../controllers/video.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

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
  .use(verifyJWT)
  .route("/:videoId")
  .get(videoController.getVideoById)
  .delete(videoController.deleteVideo)
  .patch(upload.single("thumbNail"), videoController.updateVideo);

router
  .use(verifyJWT)
  .route("/toggle/publish/:videoId")
  .patch(videoController.togglePublishStatus);

export default router;
