import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "../config/constants";
import {
  changePassword,
  getMyProfile,
  updateProfile,
} from "../features/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  // profile
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [profileError, setProfileError] = useState("");

  // password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setBio(user.bio || "");
      setPreview(
        user.profile_img ? `${API_BASE_URL}${user.profile_img}` : null,
      );
    }
  }, [user]);

  // live confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setPasswordError("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [newPassword, confirmPassword]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = () => {
    setProfileError("");

    if (!username.trim()) {
      setProfileError("Username is required");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);
    if (profileImage) {
      formData.append("profile_img", profileImage);
    }

    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => {
        toast.success("Profile updated successfully");
        navigate("/profile");
      })
      .catch((err) => {
        toast.error(err || "Failed to update profile");
      });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    dispatch(changePassword({ currentPassword, newPassword }))
      .unwrap()
      .then(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        toast.success("Password updated successfully");
      })
      .catch((err) => {
        toast.error(err || "Password change failed");
      });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 bg-white dark:bg-gray-900">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Profile
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="pt-6 space-y-6">
            {/* profile photo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-28 w-28 rounded-full overflow-hidden">
                  {preview ? (
                    <img src={preview} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="profile-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                >
                  <Camera className="h-5 w-5 text-white" />
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

            {/* profile fields */}
            <div className="space-y-4 px-6">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {profileError && (
                <p className="text-sm text-red-500">{profileError}</p>
              )}
            </div>
            <div className="space-y-4 px-6">
              <button
                onClick={handleSaveProfile}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Profile
              </button>
            </div>

            {/* change password */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl mx-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Change Password
                </h3>
              </div>

              <div className="space-y-4 p-4">
                {/* current */}
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* new */}
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* confirm */}
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={!!passwordError}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Link to="/profile" className="flex-1">
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
