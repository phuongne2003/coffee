import { Router } from "express";
import authRouter from "./auth.routes";
import ingredientRouter from "./ingredient.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/ingredients", ingredientRouter);

export default apiRouter;
