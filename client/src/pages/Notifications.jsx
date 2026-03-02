import {
  MessageCircle,
  Users,
  AtSign,
  Phone,
  PhoneMissed,
  Bell,
  CheckCheck,
  Loader2,
  UserPlus,
  UserMinus,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getNotificationsThunk,
  markAsReadThunk,
  markAllAsReadThunk,
} from "../features/notifications/notificationsSlice";

const getNotificationIcon = (type) => {
  switch (type.toUpperCase()) {
    case "MESSAGE":
      return <MessageCircle className="h-4 w-4" />;
    case "GROUP_ADD":
      return <UserPlus className="h-4 w-4" />;
    case "GROUP_REMOVE":
      return <UserMinus className="h-4 w-4" />;
    case "GROUP_LEAVE":
      return <LogOut className="h-4 w-4" />;
    case "MENTION":
      return <AtSign className="h-4 w-4" />;
    case "CALL":
      return <Phone className="h-4 w-4" />;
    case "MISSED_CALL":
      return <PhoneMissed className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return past.toLocaleDateString();
};

const getNotificationColor = (type) => {
  switch (type.toUpperCase()) {
    case "MESSAGE":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
    case "GROUP_ADD":
      return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
    case "GROUP_REMOVE":
    case "GROUP_LEAVE":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
    case "MISSED_CALL":
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    case "CALL":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
    default:
      return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
  }
};

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const observerTarget = useRef(null);

  const {
    notifications,
    unreadCount,
    currentPage,
    totalPages,
    loading,
    total,
  } = useSelector((state) => state.notifications);

  // ✅ Initial load
  useEffect(() => {
    dispatch(getNotificationsThunk({ page: 1 }));
  }, [dispatch]);

  // ✅ Intersection Observer for infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && currentPage < totalPages) {
      dispatch(getNotificationsThunk({ page: currentPage + 1 }));
    }
  }, [loading, currentPage, totalPages, dispatch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  // ✅ Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      dispatch(markAsReadThunk(notification.id));
    }

    // Navigate to chat
    if (notification.chatId) {
      // ✅ Detect if it's a group notification
      const isGroupNotification =
        notification.type === "GROUP_ADD" ||
        notification.type === "GROUP_REMOVE" ||
        notification.type === "GROUP_LEAVE";

      // ✅ Navigate to correct route (singular, not plural)
      if (isGroupNotification) {
        navigate(`/group/${notification.chatId}`);
      } else {
        // For MESSAGE type, default to private chat
        // (you might need to adjust this based on your app logic)
        navigate(`/chat/${notification.chatId}`);
      }
    }
  };

  // ✅ Mark all as read
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsReadThunk());
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
      {/* ───── Header ───── */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </p>
            )}
            {total > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {total} total
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ───── Notifications List ───── */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notifications yet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              When you get notifications, they'll show up here
            </p>
          </div>
        )}

        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700/50 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
              notification.isRead
                ? "bg-white dark:bg-gray-900"
                : "bg-blue-50 dark:bg-blue-900/10"
            }`}
          >
            {/* ───── Avatar ───── */}
            {notification.sender?.profile_img ? (
              <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                <img
                  // src={`${API_BASE_URL}${notification.sender.profile_img}`}
                  src={notification.sender.profile_img}
                  alt={notification.sender.username}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : notification.sender?.username ? (
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-lg">
                  {notification.sender.username.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
            )}

            {/* ───── Content ───── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {notification.title}
                </span>
                <span
                  className={`p-1 rounded-full flex-shrink-0 ${getNotificationColor(notification.type)}`}
                >
                  {getNotificationIcon(notification.type)}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {notification.body}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {getTimeAgo(notification.createdAt)}
              </p>
            </div>

            {/* ───── Unread Indicator ───── */}
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
            )}
          </div>
        ))}

        {/* ───── Load More Trigger ───── */}
        {currentPage < totalPages && (
          <div
            ref={observerTarget}
            className="flex items-center justify-center py-4"
          >
            {loading && (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            )}
          </div>
        )}

        {/* ───── End of List ───── */}
        {notifications.length > 0 && currentPage >= totalPages && (
          <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
            You're all caught up! 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
