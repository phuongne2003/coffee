import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      details: err.issues,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Lỗi máy chủ nội bộ",
    ...(env.NODE_ENV !== "production" && err instanceof Error
      ? { details: err.message }
      : {}),
  });
};
