import { Router } from "express";
import tweetController from "../controllers/tweet.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(tweetController.createTweet);
router.route("/user/:userId").get(tweetController.getUserTweets);
router
  .route("/:tweetId")
  .patch(tweetController.updateTweet)
  .delete(tweetController.deleteTweet);

export default router;
