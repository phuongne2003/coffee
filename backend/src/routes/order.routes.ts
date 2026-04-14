import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  createPosOrderSchema,
  updateOrderItemsSchema,
  updateOrderStatusSchema,
  updateOrderTableSchema,
} from "../validators/order.validator";

const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.use(authorize("manager", "staff"));

orderRouter.get("/", orderController.listOrders);
orderRouter.get("/:id", orderController.getOrderById);

orderRouter.post(
  "/",
  validateBody(createPosOrderSchema),
  orderController.createPosOrder,
);
orderRouter.patch(
  "/:id/items",
  validateBody(updateOrderItemsSchema),
  orderController.updateOrderItems,
);
orderRouter.patch(
  "/:id/table",
  validateBody(updateOrderTableSchema),
  orderController.updateOrderTable,
);
orderRouter.patch(
  "/:id/status",
  validateBody(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);
orderRouter.delete("/:id", orderController.deleteOrder);

export default orderRouter;
