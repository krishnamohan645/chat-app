import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Bell, User } from "lucide-react";

const navItems = [
  { icon: MessageCircle, label: "Chats", href: "/chats" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 3 },
  { icon: User, label: "Profile", href: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around lg:hidden z-50">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.href ||
          (item.href === "/chats" && location.pathname.startsWith("/chat/"));

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center gap-1 px-4 py-2 relative transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <div className="relative">
              <Icon className="h-6 w-6" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-semibold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
