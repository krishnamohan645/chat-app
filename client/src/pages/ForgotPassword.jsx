import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import { forgotPassword } from "../features/auth/authSlice";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { forgotPasswordLoading, error } = useSelector(
    (state) => state.auth
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(forgotPassword({ identifier }))
      .unwrap()
      .then(() => {
        navigate("/reset-password", { state: { identifier } });
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            We’ll send you a verification code
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={forgotPasswordLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-medium"
            >
              {forgotPasswordLoading ? "Sending OTP..." : "Send OTP"}
              <ArrowRight size={16} />
            </button>

            <div className="text-center text-sm">
              <Link to="/login" className="text-blue-500 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
