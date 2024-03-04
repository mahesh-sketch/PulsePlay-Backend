import { Router } from "express";
import subscriptionController from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  .get(subscriptionController.getSubscribedChannels)
  .post(subscriptionController.toggleSubscription);

router
  .route("/u/:subscriberId")
  .get(subscriptionController.getUserChannelSubscribers);

export default router;
