import { Response } from "express";

type SuccessPayload<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: Record<string, unknown>,
): Response<SuccessPayload<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
};
