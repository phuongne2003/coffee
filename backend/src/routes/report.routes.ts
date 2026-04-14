import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const reportRouter = Router();

reportRouter.use(authenticate);
reportRouter.use(authorize("manager", "staff"));

reportRouter.get("/summary", reportController.summary);
reportRouter.get("/by-category", reportController.byCategory);
reportRouter.get("/trend", reportController.trend);
reportRouter.get("/inventory", reportController.inventory);

export default reportRouter;
