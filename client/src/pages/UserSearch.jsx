import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search as SearchIcon,
  MessageCircle,
  UserPlus,
} from "lucide-react";

const mockUsers = [
  {
    id: "1",
    name: "Sarah Wilson",
    username: "@sarahw",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    online: true,
  },
  {
    id: "2",
    name: "Alex Chen",
    username: "@alexchen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    online: true,
  },
  {
    id: "3",
    name: "Emma Johnson",
    username: "@emmaj",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    online: false,
  },
  {
    id: "4",
    name: "Michael Brown",
    username: "@mikeb",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    online: false,
  },
  {
    id: "5",
    name: "Jessica Taylor",
    username: "@jessicat",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    online: true,
  },
  {
    id: "6",
    name: "David Kim",
    username: "@davidk",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    online: false,
  },
];

const UserSearch = () => {
  const [query, setQuery] = useState("");

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/chats">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Search Users
          </h1>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query && filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <SearchIcon className="h-12 w-12 text-gray-500 dark:text-gray-400 mb-4" />
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              No users found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try searching with a different name or username
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                  {user.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/chat/${user.id}`}>
                  <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <MessageCircle className="h-5 w-5" />
                  </button>
                </Link>
                <button className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <UserPlus className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserSearch;
