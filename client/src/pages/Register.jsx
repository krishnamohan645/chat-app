import { useState } from "react";
import { Link } from "react-router-dom";
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

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [registerMethod, setRegisterMethod] = useState("email");
  const [step, setStep] = useState("form");
  const [profileImage, setProfileImage] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Join Messenger today</p>
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
                          src={profileImage}
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
                  <label htmlFor="username" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      registerMethod === "email"
                        ? "bg-blue-500 text-white"
                        : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setRegisterMethod("email")}
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      registerMethod === "phone"
                        ? "bg-blue-500 text-white"
                        : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setRegisterMethod("phone")}
                  >
                    <Phone className="h-4 w-4" />
                    Phone
                  </button>
                </div>

                <div className="space-y-2">
                  <label htmlFor="identifier" className="block text-sm font-medium text-gray-900 dark:text-white">
                    {registerMethod === "email" ? "Email" : "Phone Number"}
                  </label>
                  <div className="relative">
                    {registerMethod === "email" ? (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <input
                      id="identifier"
                      type={registerMethod === "email" ? "email" : "tel"}
                      placeholder={registerMethod === "email" ? "john@example.com" : "+1 234 567 8900"}
                      className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white">
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 8 characters
                  </p>
                </div>

                <button
                  className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
                  onClick={() => setStep("otp")}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  By signing up, you agree to our{" "}
                  <Link to="#" className="text-blue-500 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="#" className="text-blue-500 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
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
                    {registerMethod === "email" ? "email" : "phone"}
                  </p>
                </div>

                <div className="flex justify-center gap-2 py-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-center text-xl font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>

                <button className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Didn't receive code? Resend
                </button>

                <Link to="/chats" className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium">
                  Verify & Create Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Already have an account? </span>
              <Link to="/login" className="text-blue-500 hover:underline font-medium">
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