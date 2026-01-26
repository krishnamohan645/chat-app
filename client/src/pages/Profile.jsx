import { Link } from "react-router-dom";
import { Camera, Mail, Phone, Clock, Edit } from "lucide-react";

const Profile = () => {
  const user = {
    name: "John Doe",
    username: "@johndoe",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    bio: "Software Developer | Coffee enthusiast | Building cool things 🚀",
    email: "john@example.com",
    phone: "+1 234 567 8900",
    lastSeen: "Online",
    joinedDate: "January 2024",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500/20 to-white dark:from-blue-500/10 dark:to-gray-900 pt-8 pb-16 px-4">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-900">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-full w-full object-cover"
              />
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{user.username}</p>
        </div>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="pt-6 px-6">
            <div className="text-center mb-6">
              <p className="text-gray-500 dark:text-gray-400">{user.bio}</p>
            </div>

            <Link to="/profile/edit">
              <button className="w-full mb-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {user.lastSeen}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400 pb-2">
              Joined {user.joinedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
