import { Router } from "express";
import * as mobileOrderController from "../controllers/mobile-order.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { createMobileOrderSchema } from "../validators/order.validator";

const mobileOrderRouter = Router();

mobileOrderRouter.get(
  "/tables/available",
  mobileOrderController.listMobileAvailableTables,
);

mobileOrderRouter.get(
  "/menu/:tableCode",
  mobileOrderController.getMobileMenuByTableCode,
);
mobileOrderRouter.post(
  "/orders",
  validateBody(createMobileOrderSchema),
  mobileOrderController.createMobileOrder,
);

export default mobileOrderRouter;
