import express from "express";
import swaggerUi from "swagger-ui-express";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { swaggerSpec } from "./swagger/swagger";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
