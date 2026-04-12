import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { HttpError } from "../utils/http-error";

export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new HttpError(400, "Validation failed", {
          issues: result.error.issues,
        }),
      );
      return;
    }

    req.body = result.data;
    next();
  };
