import { Router } from "express";
import * as ingredientController from "../controllers/ingredient.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  createIngredientSchema,
  updateIngredientSchema,
  updateIngredientStockSchema,
} from "../validators/ingredient.validator";

const ingredientRouter = Router();

ingredientRouter.use(authenticate);
ingredientRouter.use(authorize("manager", "staff"));

ingredientRouter.get(
  "/alerts/low-stock",
  ingredientController.getLowStockIngredients,
);
ingredientRouter.get("/", ingredientController.listIngredients);
ingredientRouter.post(
  "/",
  validateBody(createIngredientSchema),
  ingredientController.createIngredient,
);
ingredientRouter.get(
  "/:id/movements",
  ingredientController.listMovementsByIngredient,
);
ingredientRouter.get("/:id", ingredientController.getIngredientById);
ingredientRouter.patch(
  "/:id/stock",
  validateBody(updateIngredientStockSchema),
  ingredientController.updateIngredientStock,
);
ingredientRouter.patch(
  "/:id",
  validateBody(updateIngredientSchema),
  ingredientController.updateIngredient,
);
ingredientRouter.delete("/:id", ingredientController.deleteIngredient);

export default ingredientRouter;
