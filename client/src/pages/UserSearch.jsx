import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, MessageCircle } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSearch,
  getAllUsers,
  searchUsers,
} from "../features/user/userSlice";
import { API_BASE_URL } from "../config/constants";
import { createPrivateChat } from "../features/chats/chatSlice";

const UserSearch = () => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    users,
    searchUsers: searchedUsers,
    loading,
  } = useSelector((state) => state.user);

  // load all users on mount
  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  // search users
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      dispatch(clearSearch());
      dispatch(getAllUsers());
      return;
    }
    dispatch(searchUsers(debouncedQuery));
  }, [debouncedQuery, dispatch]);

  const list = debouncedQuery ? searchedUsers : users;

  const handleCreateChat = async (userId) => {
    const res = await dispatch(createPrivateChat(userId));
    if (res.meta.requestStatus === "fulfilled") {
      navigate(`/chat/${res.payload.id}`);
    }
  };

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
            placeholder="Search by name, or username..."
            className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-sm text-gray-500">Searching...</p>}

        {debouncedQuery && !loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <SearchIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p>No users found</p>
          </div>
        )}

        {list.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {user.profile_img ? (
                    <img
                      src={`${API_BASE_URL}${user.profile_img}`}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {user.username?.charAt(0)}
                    </span>
                  )}
                </div>

                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.username}
                </p>
                {user.bio && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* <Link to={`/chat/${user.id}`}> */}
              <button
                onClick={() => handleCreateChat(user.id)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              {/* </Link> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearch;
