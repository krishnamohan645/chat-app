import { io } from "socket.io-client";

let socket;

export const getSocket = (userId) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: { userId }, // 🔥 THIS IS THE KEY
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
