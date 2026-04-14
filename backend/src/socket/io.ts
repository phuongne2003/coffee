import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-table", (tableId: string) => {
      if (!tableId) {
        return;
      }

      socket.join(`table:${tableId}`);
    });

    socket.on("leave-table", (tableId: string) => {
      if (!tableId) {
        return;
      }

      socket.leave(`table:${tableId}`);
    });
  });

  return io;
};

export const getSocket = (): Server | null => io;
