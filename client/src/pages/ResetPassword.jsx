import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { resetPassword, loginUser } from "../features/auth/authSlice";

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const identifier = state?.identifier;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [confirmError, setConfirmError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const otpRefs = useRef([]);

  const { resetPasswordLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  /* -------------------- NAVIGATION SAFETY -------------------- */
  useEffect(() => {
    if (!identifier) {
      navigate("/forgot-password", { replace: true });
    }
  }, [identifier, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chats", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!identifier) return null;

  /* -------------------- OTP HANDLERS -------------------- */
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  /* -------------------- PASSWORD VALIDATION -------------------- */
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);

    if (!passwordRegex.test(value)) {
      setPasswordError(
        "Password must be 8+ chars, include number & special character"
      );
    } else {
      setPasswordError("");
    }

    // live confirm check
    if (confirmPassword && value !== confirmPassword) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);

    if (value !== newPassword) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  };

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (passwordError || confirmError) return;
    if (otp.some((d) => !d)) return;

    dispatch(
      resetPassword({
        identifier,
        otp: otp.join(""),
        newPassword,
      })
    )
      .unwrap()
      .then(() => {
        dispatch(
          loginUser({
            identifier,
            password: newPassword,
          })
        );
      })
      .catch(() => {});
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white">
            Reset Password
          </h2>

          <p className="text-sm text-center text-gray-500 mt-1">
            Enter OTP and set a new password
          </p>

          {error && (
            <p className="text-sm text-red-500 text-center mt-3">
              {error}
            </p>
          )}

          {/* OTP */}
          <div className="flex justify-center gap-2 py-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) =>
                  handleOtpChange(index, e.target.value)
                }
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg text-center text-xl font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          {/* NEW PASSWORD */}
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) =>
                  handleNewPasswordChange(e.target.value)
                }
                className="w-full pl-10 pr-10 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(!showNewPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showNewPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>

            {passwordError && (
              <p className="text-xs text-red-500">
                {passwordError}
              </p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="space-y-1 mt-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) =>
                  handleConfirmPasswordChange(e.target.value)
                }
                className="w-full pl-10 pr-10 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>

            {confirmError && (
              <p className="text-xs text-red-500">
                {confirmError}
              </p>
            )}
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={
              resetPasswordLoading ||
              otp.some((d) => !d) ||
              passwordError ||
              confirmError
            }
            className={`mt-6 w-full px-4 py-3 rounded-lg text-white font-medium ${
              resetPasswordLoading ||
              passwordError ||
              confirmError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {resetPasswordLoading
              ? "Resetting..."
              : "Reset & Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
