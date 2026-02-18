import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Menu } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import { API_BASE_URL } from "../../config/constants";

const TopNav = ({ onMenuClick, unreadNotifications = 3 }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const avatarUrl = user?.profile_img
    ? `${API_BASE_URL}${user.profile_img}`
    : null;

  const initials = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/chats" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="font-semibold text-lg text-gray-900 dark:text-white hidden sm:block">
            Messenger
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/search">
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Search className="h-5 w-5" />
          </button>
        </Link>

        <Link to="/notifications" className="relative">
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
        </Link>

        <div className="relative">
          <button
            className="p-2 relative h-9 w-9 rounded-full overflow-hidden"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {initials}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="flex items-center gap-2 p-2">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username || "User"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || ""}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

              <Link
                to="/profile"
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>

              <Link
                to="/settings"
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

              <div
                onClick={handleLogout}
                className="w-full block relative px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 hover:rounded-b-lg cursor-pointer"
              >
                <button>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
