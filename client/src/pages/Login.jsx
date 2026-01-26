import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [showOTP, setShowOTP] = useState(false);
  const [activeTab, setActiveTab] = useState("password");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
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
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sign In
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose your preferred login method
            </p>
          </div>
          <div className="p-6">
            <div className="w-full">
              <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "password"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  onClick={() => setActiveTab("password")}
                >
                  Password
                </button>
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "otp"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  onClick={() => setActiveTab("otp")}
                >
                  OTP
                </button>
              </div>

              {activeTab === "password" ? (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        loginMethod === "email"
                          ? "bg-blue-500 text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setLoginMethod("email")}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        loginMethod === "phone"
                          ? "bg-blue-500 text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setLoginMethod("phone")}
                    >
                      <Phone className="h-4 w-4" />
                      Phone
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="identifier"
                      className="block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {loginMethod === "email" ? "Email" : "Phone Number"}
                    </label>
                    <div className="relative">
                      {loginMethod === "email" ? (
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      )}
                      <input
                        id="identifier"
                        type={loginMethod === "email" ? "email" : "tel"}
                        placeholder={
                          loginMethod === "email"
                            ? "john@example.com"
                            : "+1 234 567 8900"
                        }
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

                  <div className="flex items-center justify-end">
                    <Link
                      to="#"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Link
                    to="/chats"
                    className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showOTP ? (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="otp-phone"
                          className="block text-sm font-medium text-gray-900 dark:text-white"
                        >
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <input
                            id="otp-phone"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                        onClick={() => setShowOTP(true)}
                      >
                        Send OTP
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Enter the 6-digit code sent to your phone
                          </p>
                        </div>
                        <div className="flex justify-center gap-2 py-4">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength="1"
                              value={otp[index]}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                              className="w-12 h-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-center text-xl font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ))}
                        </div>
                        <button
                          className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          onClick={() => setShowOTP(false)}
                        >
                          Didn't receive code? Resend
                        </button>
                      </div>

                      <Link
                        to="/chats"
                        className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        Verify & Sign In
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                </div>
              )}

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
