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

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, location.pathname, navigate]);

  // 🔹 Register device after login
  useEffect(() => {
    if (!isAuthenticated) return;

    const run = async () => {
      const fcmToken = await getFcmToken();
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
  }, [isAuthenticated, dispatch]);

  if (authLoading) return null;

  return null;
};

export default AuthWatcher;
