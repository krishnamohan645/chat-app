import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Lock,
  Shield,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getSettings,
  updateSettings,
} from "../features/settings/settingsSlice";
import { logoutUser } from "../features/auth/authSlice";

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data } = useSelector((state) => state.settings);
  const [privacy, setPrivacy] = useState({
    lastSeen: true,
    readReceipts: true,
  });

  const [notifications, setNotifications] = useState({
    push: true,
    sounds: true,
    email: false,
  });
  const [photoVisibility, setPhotoVisibility] = useState("everyone");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  useEffect(() => {
    if (!data) return;

    setNotifications((prev) => ({
      ...prev,
      push: data.pushNotifications,
      sounds: data.messageSounds,
      email: data.emailNotifications,
    }));

    setPrivacy((prev) => ({
      ...prev,
      lastSeen: data.lastSeenVisibility === "everyone",
      readReceipts: data.showReadReceipts,
    }));
    setPhotoVisibility(data.profilePhotoVisibility || "everyone");
  }, [data?.id]); // 👈 IMPORTANT

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);

    dispatch(
      updateSettings({
        pushNotifications: updated.push,
        messageSounds: updated.sounds,
        emailNotifications: updated.email,
      }),
    );
  };

  const togglePrivacy = (key) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);

    dispatch(
      updateSettings({
        lastSeenVisibility: updated.lastSeen ? "everyone" : "only_me",
        showReadReceipts: updated.readReceipts,
      }),
    );
  };

  const updatePhotoVisibility = (value) => {
    setPhotoVisibility(value);
    setShowPhotoOptions(false);

    dispatch(
      updateSettings({
        profilePhotoVisibility: value,
      }),
    );
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 bg-white dark:bg-gray-900">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Settings
        </h1>

        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                  Notifications
                </h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Push Notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive push notifications
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.push}
                    onChange={() => toggleNotification("push")}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Message Sounds
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Play sound for new messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.sounds}
                    onChange={() => toggleNotification("sounds")}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive email updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.email}
                    onChange={() => toggleNotification("email")}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                  Privacy
                </h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Last Seen
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Show when you were last online
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacy.lastSeen}
                    onChange={() => togglePrivacy("lastSeen")}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Read Receipts
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Let others see when you've read messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacy.readReceipts}
                    onChange={() => togglePrivacy("readReceipts")}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    Profile Photo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Who can see your profile photo
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowPhotoOptions(!showPhotoOptions)}
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 text-sm"
                  >
                    {photoVisibility === "everyone" ? "Everyone" : "Only Me"}
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {showPhotoOptions && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow z-10">
                      <button
                        onClick={() => updatePhotoVisibility("everyone")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Everyone
                      </button>
                      <button
                        onClick={() => updatePhotoVisibility("only_me")}
                        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Only Me
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">Appearance</h2>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Use dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div> */}

          {/* Other */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">Other</h2>
              </div>
            </div>
            <div className="space-y-2 p-2">
              <button className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Help & Support</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button className="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">Terms & Privacy Policy</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div> */}

          {/* Logout */}
          <div
            onClick={handleLogout}
            className="w-full px-4 py-3 cursor-pointer bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Messenger v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
