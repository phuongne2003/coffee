import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  authController.register,
);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.get("/me", authenticate, authController.me);

export default authRouter;
