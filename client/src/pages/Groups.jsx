import { Link } from "react-router-dom";
import { Search, Plus, Users } from "lucide-react";

const mockGroups = [
  {
    id: "1",
    name: "Dev Team",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
    lastMessage: "Mike: The deployment is complete ✅",
    time: "15m",
    unread: 12,
    memberCount: 8,
  },
  {
    id: "2",
    name: "Project Alpha",
    avatar:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
    lastMessage: "Lisa: Updated the design files",
    time: "3h",
    unread: 0,
    memberCount: 5,
  },
  {
    id: "3",
    name: "Marketing Team",
    avatar:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop",
    lastMessage: "New campaign launch tomorrow!",
    time: "1d",
    unread: 3,
    memberCount: 12,
  },
  {
    id: "4",
    name: "Design Squad",
    avatar:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=100&h=100&fit=crop",
    lastMessage: "Check out the new mockups",
    time: "2d",
    unread: 0,
    memberCount: 6,
  },
];

const Groups = () => {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Groups
          </h1>
          <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockGroups.map((group) => (
          <Link
            key={group.id}
            to={`/group/${group.id}`}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700/50"
          >
            <div className="h-12 w-12 rounded-full overflow-hidden">
              <img
                src={group.avatar}
                alt={group.name}
                className="h-full w-full object-cover"
              />
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {group.name.charAt(0)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {group.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {group.time}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {group.lastMessage}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                <Users className="h-3 w-3" />
                {group.memberCount} members
              </p>
            </div>

            {group.unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5">
                {group.unread > 9 ? "9+" : group.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Groups;
