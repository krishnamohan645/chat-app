// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { disconnectSocket, initSocket } from "./socket";
// import {
//   registerSocketListeners,
//   resetSocketListeners,
// } from "./socketListeners";

// const SocketProvider = ({ children }) => {
//   const dispatch = useDispatch();
//   const { token, isAuthenticated } = useSelector((state) => state.auth);

//   // ✅ Initialize socket when authenticated
//   useEffect(() => {
//     if (!isAuthenticated || !token) return;

//     console.log("🔌 Connecting socket");
//     initSocket(token);

//     registerSocketListeners(dispatch);

//     return () => {
//       console.log("🔌 Disconnecting socket");
//       disconnectSocket();
//       resetSocketListeners();
//     };
//   }, [isAuthenticated, token, dispatch]);

//   return children;
// };

// export default SocketProvider;

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { disconnectSocket, initSocket, getSocket } from "./socket";
import {
  registerSocketListeners,
  resetSocketListeners,
} from "./socketListeners";

const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    console.log("🔌 Connecting socket");
    const socket = initSocket(token);

    if (!socket) return;

    // ✅ Register listeners AFTER socket connects
    const handleConnect = () => {
      console.log("✅ Socket connected, now registering listeners");
      registerSocketListeners(dispatch);
    };

    // If already connected, register immediately
    if (socket.connected) {
      console.log("✅ Socket already connected, registering listeners");
      registerSocketListeners(dispatch);
    } else {
      // Wait for connection
      socket.on("connect", handleConnect);
    }

    return () => {
      console.log("🔌 Disconnecting socket");
      socket.off("connect", handleConnect);
      disconnectSocket();
      resetSocketListeners();
    };
  }, [isAuthenticated, token, dispatch]);

  return children;
};

export default SocketProvider;
