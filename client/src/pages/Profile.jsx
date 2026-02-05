import { Link } from "react-router-dom";
import { Mail, Phone, Clock, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getMyProfile } from "../features/user/userSlice";
import { useEffect } from "react";
import { API_BASE_URL } from "../config/constants";

const Profile = () => {
  const dispatch = useDispatch();
  const { loading, user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    username,
    email,
    mobile,
    // profile_img,
    bio,
    isOnline,
    lastSeen,
    createdAt,
  } = user;

  const joinedDate = new Date(createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const statusText = isOnline
    ? "Online"
    : lastSeen
      ? `Last seen ${new Date(lastSeen).toLocaleString()}`
      : "Offline";

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500/20 to-white dark:from-blue-500/10 dark:to-gray-900 pt-8 pb-16 px-4">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {user?.profile_img ? (
                <img
                  src={`${API_BASE_URL}${user.profile_img}`}
                  alt={user.username}
                />
              ) : (
                <div className="h-28 w-28 bg-gray-300 rounded-full flex items-center justify-center">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {isOnline && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white dark:border-gray-900" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {username}
          </h1>

          {bio && (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-1">
              {bio}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="pt-6 px-6">
            <Link to="/profile/edit">
              <button className="w-full mb-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              {mobile && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {mobile}
                    </p>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {isOnline && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    {statusText}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

            <p className="text-sm text-center text-gray-500 pb-4">
              Joined {joinedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
