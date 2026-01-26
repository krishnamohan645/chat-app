import { Link } from "react-router-dom";
import {
  MessageCircle,
  Users,
  AtSign,
  Phone,
  PhoneMissed,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";

const mockNotifications = [
  {
    id: "1",
    type: "message",
    title: "Sarah Wilson",
    description: "Sent you a message: Hey! Are you coming...",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    time: "2m",
    read: false,
  },
  {
    id: "2",
    type: "group_add",
    title: "Dev Team",
    description: "You were added to the group",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
    time: "15m",
    read: false,
  },
  {
    id: "3",
    type: "mention",
    title: "Project Alpha",
    description: "Mike mentioned you: @John can you review...",
    avatar:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
    time: "1h",
    read: false,
  },
  {
    id: "4",
    type: "call",
    title: "Alex Chen",
    description: "Incoming voice call",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    time: "2h",
    read: true,
  },
  {
    id: "5",
    type: "missed_call",
    title: "Emma Johnson",
    description: "Missed video call",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    time: "3h",
    read: true,
  },
  {
    id: "6",
    type: "system",
    title: "Account Security",
    description: "Your password was changed successfully",
    time: "1d",
    read: true,
  },
];

const getNotificationIcon = (type) => {
  switch (type) {
    case "message":
      return <MessageCircle className="h-4 w-4" />;
    case "group_add":
      return <Users className="h-4 w-4" />;
    case "mention":
      return <AtSign className="h-4 w-4" />;
    case "call":
      return <Phone className="h-4 w-4" />;
    case "missed_call":
      return <PhoneMissed className="h-4 w-4" />;
    case "system":
      return <Bell className="h-4 w-4" />;
  }
};

const Notifications = () => {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
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
          </div>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700/50 transition-colors cursor-pointer ${
              notification.read
                ? "bg-white dark:bg-gray-900"
                : "bg-blue-50 dark:bg-blue-900/10"
            }`}
          >
            {notification.avatar ? (
              <div className="h-12 w-12 rounded-full overflow-hidden">
                <img
                  src={notification.avatar}
                  alt={notification.title}
                  className="h-full w-full object-cover"
                />
                <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {notification.title.charAt(0)}
                </div>
              </div>
            ) : (
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {getNotificationIcon(notification.type)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </span>
                <span
                  className={`p-1 rounded-full ${
                    notification.type === "missed_call"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {notification.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {notification.time} ago
              </p>
            </div>

            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
