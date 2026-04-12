import { Request, Response } from "express";
import { sendSuccess } from "../utils/api-response";

export const getHealth = (_req: Request, res: Response): Response => {
  return sendSuccess(res, 200, "Service is healthy", {
    status: "ok",
    timestamp: new Date().toISOString(),
  });
};
