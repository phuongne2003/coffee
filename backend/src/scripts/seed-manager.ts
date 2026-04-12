import { connectToDatabase } from "../config/database";
import { User } from "../models/user.model";

const run = async (): Promise<void> => {
  await connectToDatabase();

  const email = process.env.MANAGER_EMAIL ?? "manager@gmail.com";
  const password = process.env.MANAGER_PASSWORD ?? "Password123";
  const fullName = process.env.MANAGER_FULL_NAME ?? "Default Manager";

  const existed = await User.findOne({ email });
  if (existed) {
    console.log("Manager already exists:", email);
    process.exit(0);
  }

  await User.create({
    fullName,
    email,
    password,
    role: "manager",
    isActive: true,
  });

  console.log("Manager created:", email);
  process.exit(0);
};

void run().catch((error) => {
  console.error("Seed manager failed", error);
  process.exit(1);
});
