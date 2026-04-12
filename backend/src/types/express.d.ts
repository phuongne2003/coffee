import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface UserPayload extends JwtPayload {
      userId: string;
      role: "manager" | "staff" | "customer";
      email: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
