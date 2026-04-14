import { Router } from "express";
import authRouter from "./auth.routes";
import categoryRouter from "./category.routes";
import ingredientRouter from "./ingredient.routes";
import menuItemRouter from "./menu-item.routes";
import mobileOrderRouter from "./mobile-order.routes";
import orderRouter from "./order.routes";
import tableRouter from "./table.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/ingredients", ingredientRouter);
apiRouter.use("/menu-items", menuItemRouter);
apiRouter.use("/tables", tableRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/mobile", mobileOrderRouter);

export default apiRouter;
