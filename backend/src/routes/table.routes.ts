import { Router } from "express";
import * as tableController from "../controllers/table.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  createTableSchema,
  toggleTableSchema,
  updateTableSchema,
} from "../validators/table.validator";

const tableRouter = Router();

tableRouter.use(authenticate);

tableRouter.get("/", authorize("manager", "staff"), tableController.listTables);
tableRouter.get(
  "/:id",
  authorize("manager", "staff"),
  tableController.getTableById,
);

tableRouter.post(
  "/",
  authorize("manager"),
  validateBody(createTableSchema),
  tableController.createTable,
);

tableRouter.patch(
  "/:id/toggle",
  authorize("manager"),
  validateBody(toggleTableSchema),
  tableController.toggleTable,
);

tableRouter.patch(
  "/:id",
  authorize("manager"),
  validateBody(updateTableSchema),
  tableController.updateTable,
);

tableRouter.delete("/:id", authorize("manager"), tableController.deleteTable);

export default tableRouter;
