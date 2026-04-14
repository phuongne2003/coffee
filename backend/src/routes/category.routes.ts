import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  createCategorySchema,
  reorderCategoriesSchema,
  toggleCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";

const categoryRouter = Router();

categoryRouter.use(authenticate);

categoryRouter.get("/", authorize("manager", "staff", "customer"), categoryController.listCategories);
categoryRouter.get("/:id", authorize("manager", "staff", "customer"), categoryController.getCategoryById);

categoryRouter.post(
  "/",
  authorize("manager"),
  validateBody(createCategorySchema),
  categoryController.createCategory,
);

categoryRouter.patch(
  "/reorder",
  authorize("manager"),
  validateBody(reorderCategoriesSchema),
  categoryController.reorderCategories,
);

categoryRouter.patch(
  "/:id/toggle",
  authorize("manager"),
  validateBody(toggleCategorySchema),
  categoryController.toggleCategory,
);

categoryRouter.patch(
  "/:id",
  authorize("manager"),
  validateBody(updateCategorySchema),
  categoryController.updateCategory,
);

categoryRouter.delete("/:id", authorize("manager"), categoryController.deleteCategory);

export default categoryRouter;
