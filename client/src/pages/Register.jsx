import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  Camera,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, resendOtp, verifyOtp } from "../features/auth/authSlice";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, otpSent, error } = useSelector((state) => state.auth);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    username: "",
    identifier: "",
    password: "",
    profile_img: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("form");
  const [profileImage, setProfileImage] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const autoMovedToOtp = useRef(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.id]: e.target.value,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
    }
  };

  const handleRegister = () => {
    const formData = new FormData();

    formData.append("username", form.username);
    formData.append("identifier", form.identifier);
    formData.append("password", form.password);
    if (profileImage) {
      formData.append("profile_img", profileImage);
    }

    // for (let pair of formData.entries()) {
    //   console.log(pair[0], pair[1]);
    // }

    dispatch(registerUser(formData));
  };

  useEffect(() => {
    if (
      (otpSent || error === "OTP already sent. Please verify") &&
      step !== "otp"
    ) {
      setStep("otp");
    }
  }, [otpSent, error, step]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
    if (index === 5 && value) {
      const otpValue = [...newOtp].join("");
      if (otpValue.length === 6) {
        dispatch(
          verifyOtp({
            identifier: form.identifier,
            otp: otpValue,
          }),
        );
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpValue = otp.join("");
    console.log(otpValue);

    if (otpValue.length !== 6) {
      alert("Enter valid OTP");
      return;
    }
    dispatch(
      verifyOtp({
        identifier: form.identifier,
        otp: otpValue,
      }),
    );
    // navigate("/chats");
  };

  const handleResendOtp = () => {
    dispatch(
      resendOtp({
        identifier: form.identifier,
      }),
    );
  };

  useEffect(() => {
    if (
      !autoMovedToOtp.current &&
      (otpSent || error === "OTP already sent. Please verify")
    ) {
      setStep("otp");
      autoMovedToOtp.current = true;
    }
  }, [otpSent, error]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chats");
    }
  }, [isAuthenticated, navigate]);


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Join Messenger today
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step === "form" ? "Sign Up" : "Verify Account"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === "form"
                ? "Fill in your details to get started"
                : "Enter the verification code"}
            </p>
          </div>
          <div className="p-6">
            {step === "form" ? (
              <div className="space-y-4">
                {/* Profile Photo */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden">
                      {profileImage ? (
                        <img
                          src={URL.createObjectURL(profileImage)}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="profile-upload"
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-white" />
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <input
                      id="username"
                      placeholder="johndoe"
                      value={form.username}
                      className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleChange(e)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Email
                  </label>
                  <div className="relative">
                    {/* <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" /> */}
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <input
                      id="identifier"
                      // type="text"
                      value={form.identifier}
                      placeholder="johndoe@gmail.com"
                      className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleChange(e)}
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
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleChange(e)}
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 8 characters
                  </p>
                  {error && step === "form" && (
                    <p className="text-sm text-red-500 text-center mt-2">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 -ml-2 mb-2"
                  onClick={() => setStep("form")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We sent a 6-digit verification code to your{" "}
                    {/* {registerMethod === "email" ? "email" : "phone"} */}
                    email
                  </p>
                </div>

                <div className="flex justify-center gap-2 py-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-center text-xl font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-gray-500">
                  Didn't receive code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-medium text-red-500 hover:underline"
                    disabled={loading}
                  >
                    Resend
                  </button>
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.some((d) => !d)}
                  className={`block w-full px-4 py-3 rounded-lg ${
                    otp.some((d) => !d)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
                >
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>
                {error && step === "otp" && (
                  <p className="text-sm text-red-500 text-center mt-2">
                    {error}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-blue-500 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
