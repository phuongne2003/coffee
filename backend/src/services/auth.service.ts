import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, UserDocument } from "../models/user.model";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { HttpError } from "../utils/http-error";

const createAccessToken = (user: UserDocument): string => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
};

export const login = async (payload: LoginInput) => {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new HttpError(401, "Email hoặc mật khẩu không đúng");
  }

  const matched = await user.comparePassword(payload.password);

  if (!matched) {
    throw new HttpError(401, "Email hoặc mật khẩu không đúng");
  }

  if (!user.isActive) {
    throw new HttpError(403, "Tài khoản đã bị vô hiệu hóa");
  }

  const token = createAccessToken(user);

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};

export const register = async (payload: RegisterInput) => {
  const existedUser = await User.findOne({ email: payload.email });

  if (existedUser) {
    throw new HttpError(409, "Email đã được sử dụng");
  }

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    isActive: true,
  });

  const token = createAccessToken(user);

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};
