// socket/socket.js
import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (!token) return null;
  if (socket) return socket;

  socket = io("http://localhost:5000", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
    socket.emit("join-user");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
