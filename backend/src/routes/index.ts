import { Router } from "express";
import authRouter from "./auth.routes";
import categoryRouter from "./category.routes";
import ingredientRouter from "./ingredient.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/ingredients", ingredientRouter);

export default apiRouter;
