import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";

const mockChats = [
  {
    id: "1",
    name: "Sarah Wilson",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    lastMessage: "Hey! Are you coming to the party tonight?",
    time: "2m",
    unread: 3,
    online: true,
  },
  {
    id: "2",
    name: "Dev Team",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
    lastMessage: "Mike: The deployment is complete ✅",
    time: "15m",
    unread: 12,
    online: false,
    isGroup: true,
  },
  {
    id: "3",
    name: "Alex Chen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    lastMessage: "Thanks for the help yesterday!",
    time: "1h",
    unread: 0,
    online: true,
  },
  {
    id: "4",
    name: "Emma Johnson",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    lastMessage: "The meeting is scheduled for tomorrow",
    time: "2h",
    unread: 1,
    online: false,
  },
  {
    id: "5",
    name: "Project Alpha",
    avatar:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop",
    lastMessage: "Lisa: Updated the design files",
    time: "3h",
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: "6",
    name: "Michael Brown",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    lastMessage: "Let's catch up soon!",
    time: "1d",
    unread: 0,
    online: false,
  },
  {
    id: "7",
    name: "Jessica Taylor",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    lastMessage: "You: Sounds good! 👍",
    time: "2d",
    unread: 0,
    online: true,
  },
];

const ChatList = () => {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h1>
          <Link to="/search">
            <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
              <Plus className="h-5 w-5" />
            </button>
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockChats.map((chat) => (
          <Link
            key={chat.id}
            to={chat.isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700/50"
          >
            <div className="relative">
              <div className="h-12 w-12 rounded-full overflow-hidden">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="h-full w-full object-cover"
                />
                <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {chat.name.charAt(0)}
                </div>
              </div>
              {chat.online && !chat.isGroup && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-white truncate">{chat.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{chat.time}</span>
              </div>
              <p className={`text-sm truncate ${
                chat.unread > 0 
                  ? "text-gray-900 dark:text-white font-medium" 
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {chat.lastMessage}
              </p>
            </div>

            {chat.unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5">
                {chat.unread > 9 ? "9+" : chat.unread}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatList;