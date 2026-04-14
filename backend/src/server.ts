import { createServer } from "http";
import app from "./app";
import { connectToDatabase } from "./config/database";
import { env } from "./config/env";
import { initSocket } from "./socket/io";

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();

    const server = createServer(app);
    initSocket(server);

    server.listen(env.PORT, () => {
      // Giữ log ngắn gọn để dễ theo dõi khi phát triển local.
      console.log(`Server listening at http://localhost:${env.PORT}`);
      console.log(`API Docs: http://localhost:${env.PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
