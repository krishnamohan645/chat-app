import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getChatList, setActiveChat } from "../features/chats/chatSlice";
import { API_BASE_URL } from "../config/constants";
import { formatChatTime } from "../utils/dateFormatter";

const ChatList = () => {
  const dispatch = useDispatch();
  const { chats, loading, myUserId } = useSelector((state) => state.chats);
  console.log(chats, myUserId, "chats in chatlist");

  const { isAuthenticated, authLoading } = useSelector(
    (state) => state.auth,
  );

  // ✅ hooks always run
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log("📋 Fetching chat list...");
      dispatch(getChatList());
    }
  }, [isAuthenticated, authLoading, dispatch]);

  // Socket listeners

  if (loading) return <p>Loading...</p>;

  /* ---------------- EMPTY STATE ---------------- */
  if (!chats || chats.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chats
            </h1>
            <Link to="/search">
              <button className="p-2 bg-blue-500 text-white rounded-full">
                <Plus className="h-5 w-5" />
              </button>
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 bg-gray-100 rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center text-gray-500">
          No chats yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chats
          </h1>
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
        {chats.map((chat) => (
          <Link
            key={chat.chatId}
            to={`/chat/${chat.chatId}`}
            onClick={() => dispatch(setActiveChat(chat))}
            className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700/50"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {chat.profile_img ? (
                  <img
                    src={`${API_BASE_URL}${chat.profile_img}`}
                    alt={chat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {chat.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {chat.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {chat.name}
                </span>

                {chat.lastMessageAt && (
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-400">
                    <span>{formatChatTime(chat.lastMessageAt)}</span>
                  </span>
                )}
              </div>

              <p className="text-medium truncate text-gray-500 dark:text-gray-400 ">
                {chat.lastMessage ? chat.lastMessage.text : "No messages yet"}
              </p>
            </div>

            {/* Unread badge */}
            {chat.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5">
                {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
