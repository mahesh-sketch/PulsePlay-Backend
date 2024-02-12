import { Router } from "express";
import dashboardController from "../controllers/dashboard.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(dashboardController.getChannelStats);
router.route("/videos").get(dashboardController.getChannelVideos);

export default router;
