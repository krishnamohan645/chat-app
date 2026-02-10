import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { initAuth } from "./features/auth/authSlice";
import AuthWatcher from "./AuthWatcher";
import AppRoutes from "./routes/AppRoutes"; 
import { setMyUserId } from "./features/chats/chatSlice";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, authLoading } = useSelector(
    (state) => state.auth,
  );

  // Initialize auth on mount
  useEffect(() => {
    console.log("🚀 App starting, initializing auth...");
    dispatch(initAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(setMyUserId(user.id));
    }
  }, [isAuthenticated, user?.id, dispatch]);

  //  Show loading screen until auth check completes
  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        <div>
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>
            Loading...
          </div>
          <div style={{ fontSize: "14px", opacity: 0.7 }}>
            Checking authentication
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <AuthWatcher />
      <AppRoutes />
    </>
  );
};

export default App;
