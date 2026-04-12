import { NextFunction, Request, Response } from "express";
import { UserRole } from "../models/user.model";
import { HttpError } from "../utils/http-error";

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }

    next();
  };
