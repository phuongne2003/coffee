import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/api-response";
import * as authService from "../services/auth.service";
import { HttpError } from "../utils/http-error";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, "Đăng nhập thành công", result);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, 201, "Đăng ký thành công", result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Chưa được xác thực");
  }

  return sendSuccess(res, 200, "Thông tin người dùng hiện tại", {
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role,
  });
});
