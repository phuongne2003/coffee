import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";

const reportRouter = Router();

reportRouter.use(authenticate);
reportRouter.use(authorize("manager", "staff"));

reportRouter.get("/summary", reportController.getSummary);
reportRouter.get("/by-category", reportController.getByCategory);
reportRouter.get("/trend", reportController.getTrend);
reportRouter.get("/inventory", reportController.getInventory);

export default reportRouter;
