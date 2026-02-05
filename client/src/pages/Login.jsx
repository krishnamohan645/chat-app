import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth,
  );
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleLogin = () => {
    dispatch(loginUser(form));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chats");
    }
  }, [isAuthenticated, navigate]);

  const handleForgotNavigate = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Sign in to continue to Messenger
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="w-full">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />

                    <input
                      id="identifier"
                      type="email"
                      value={form.identifier}
                      onChange={handleChange}
                      placeholder={"john@example.com"}
                      className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-red-500 text-sm mb-2 text-center">
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleForgotNavigate}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Forgot password
                  </button>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-2 rounded flex justify-center items-center gap-2"
                >
                  {loading ? "Signing in..." : "Sign In"}
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Don't have an account?{" "}
                </span>
                <Link
                  to="/register"
                  className="text-blue-500 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
