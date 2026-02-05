import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { initAuth } from "./features/auth/authSlice";
import AuthWatcher from "./AuthWatcher";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {  initSocket } from "./socket/socket";
import { setMyUserId } from "./features/chats/chatSlice";

const App = () => {
  const dispatch = useDispatch();
  const { authLoading } = useSelector((state) => state.auth);
  const { user, accessToken } = useSelector((state) => state.auth);
  console.log(user, "user in app");

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);


useEffect(() => {
  if (!user || !accessToken) return;

  const socket = initSocket(user.id);

  const joinUser = () => {
    console.log("👤 EMITTING join-user:", user.id);
    socket.emit("join-user", user.id);
  };

  if (socket.connected) joinUser();
  socket.on("connect", joinUser);

  return () => socket.off("connect", joinUser);
}, [user?.id, accessToken]);

  useEffect(() => {
    if (user?.id) {
      dispatch(setMyUserId(user.id));
    }
  }, [user?.id, dispatch]);

  // 🔥 BLOCK ALL ROUTES UNTIL AUTH IS READY
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />
      <AuthWatcher />
      <AppRoutes />
    </>
  );
};

export default App;
