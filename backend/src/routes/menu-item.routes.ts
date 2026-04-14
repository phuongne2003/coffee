import { Router } from "express";
import * as menuItemController from "../controllers/menu-item.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  createMenuItemSchema,
  toggleMenuItemAvailabilitySchema,
  updateMenuItemSchema,
} from "../validators/menu-item.validator";

const menuItemRouter = Router();

menuItemRouter.use(authenticate);

menuItemRouter.get(
  "/",
  authorize("manager", "staff", "customer"),
  menuItemController.listMenuItems,
);
menuItemRouter.get(
  "/:id",
  authorize("manager", "staff", "customer"),
  menuItemController.getMenuItemById,
);

menuItemRouter.post(
  "/",
  authorize("manager"),
  validateBody(createMenuItemSchema),
  menuItemController.createMenuItem,
);

menuItemRouter.patch(
  "/:id/availability",
  authorize("manager"),
  validateBody(toggleMenuItemAvailabilitySchema),
  menuItemController.toggleMenuItemAvailability,
);

menuItemRouter.patch(
  "/:id",
  authorize("manager"),
  validateBody(updateMenuItemSchema),
  menuItemController.updateMenuItem,
);

menuItemRouter.delete(
  "/:id",
  authorize("manager"),
  menuItemController.deleteMenuItem,
);

export default menuItemRouter;
