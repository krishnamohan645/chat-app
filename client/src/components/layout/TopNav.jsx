import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Menu } from "lucide-react";

const TopNav = ({ onMenuClick, unreadNotifications = 3 }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
              alt="User"
              className="h-full w-full rounded-full object-cover"
            />
            <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mt-[8rem]">
              JD
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="flex items-center gap-2 p-2">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                  <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    JD
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    John Doe
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    john@example.com
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
              <Link
                to="/login"
                className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                onClick={() => setDropdownOpen(false)}
              >
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
