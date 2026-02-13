// // socket/socket.js
// import { io } from "socket.io-client";

// let socket = null;

// export const initSocket = (token) => {
//   if (!token) return null;
//   if (socket) return socket;

//   socket = io("http://localhost:5000", {
//     auth: { token },
//     transports: ["websocket"],
//   });

//   socket.on("connect", () => {
//     console.log("🟢 Socket connected:", socket.id);
//     socket.emit("join-user");
//   });

//   return socket;
// };

// export const getSocket = () => socket;

// export const disconnectSocket = () => {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//   }
// };

import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (!token) return null;

  // ✅ If socket exists and is connected, return it
  if (socket && socket.connected) {
    console.log("🔄 Reusing existing socket connection");
    return socket;
  }

  // ✅ Disconnect old socket if exists
  if (socket) {
    console.log("🔌 Cleaning up old socket");
    socket.disconnect();
    socket = null;
  }

  console.log("🔌 Creating new socket connection");
  socket = io("http://localhost:5000", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
    socket.emit("join-user");
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Disconnecting socket");
    socket.disconnect();
    socket = null;
  }
};
