import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFcmToken } from "./firebase";
import { registerDevice } from "./features/user/userSlice";
import { useLocation, useNavigate } from "react-router-dom";

const AuthWatcher = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (authLoading) return;

    // ⛔ Allow public auth routes
    const publicRoutes = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ];

    if (publicRoutes.includes(location.pathname)) return;

    if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
      navigate("/login", { replace: true });
    }
    console.log("AUTH WATCHER CHECK:", {
      authLoading,
      isAuthenticated,
      path: location.pathname,
    });
  }, [authLoading, isAuthenticated, location.pathname, navigate]);

  // 🔹 Register device after login
  useEffect(() => {
    if (!isAuthenticated) return;

    const run = async () => {
      const fcmToken = await getFcmToken(token);
      if (fcmToken) {
        dispatch(
          registerDevice({
            pushToken: fcmToken,
            deviceType: "web",
          }),
        );
      }
    };
    run();
  }, [isAuthenticated, dispatch,token]);

  if (authLoading) return null;

  return null;
};

export default AuthWatcher;
