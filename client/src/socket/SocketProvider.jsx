import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { disconnectSocket, initSocket } from "./socket";
import {
  registerSocketListeners,
  resetSocketListeners,
} from "./socketListeners";

const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  // ✅ Initialize socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    console.log("🔌 Connecting socket");
    initSocket(token);

    registerSocketListeners(dispatch);

    return () => {
      console.log("🔌 Disconnecting socket");
      disconnectSocket();
      resetSocketListeners();
    };
  }, [isAuthenticated, token, dispatch]);

  return children;
};

export default SocketProvider;
