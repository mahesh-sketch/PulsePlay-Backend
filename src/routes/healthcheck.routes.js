import { Router } from "express";
import healthcheckController from "../controllers/healthcheck.controller.js";

const router = Router();

router.route("/").get(healthcheckController.healthcheck);

export default router;
