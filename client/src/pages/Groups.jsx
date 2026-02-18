import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Users, Camera, Cross, X } from "lucide-react";
import {
  getGroupsThunk,
  createGroupThunk,
} from "../features/groups/groupsSlice";
import { getAllUsers } from "../features/user/userSlice";
import { API_BASE_URL } from "../config/constants";

const Groups = () => {
  const dispatch = useDispatch();
  const { groups, loading } = useSelector((state) => state.group);
  console.log(groups, "groups in groups.jsx");
  const { users } = useSelector((state) => state.user);
  const currentUser = useSelector((state) => state.auth.user);

  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    dispatch(getGroupsThunk());
    dispatch(getAllUsers());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer); // cleanup on every keystroke
  }, [search]);

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    await dispatch(
      createGroupThunk({
        name: groupName,
        description: groupDescription,
        members: selectedMembers,
        groupImage,
      }),
    );

    setShowModal(false);
    setGroupName("");
    setGroupDescription("");
    setGroupImage(null);
    setSelectedMembers([]);
    setMemberSearch("");
  };

  const filteredUsers = users?.filter((user) =>
    user.username?.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const filteredGroups = groups
    ?.filter((chat) => chat.type === "group")
    .filter(
      (group) =>
        group.name?.toLowerCase().includes(debouncedSearch.toLowerCase()), // 👈 change this
    );

  console.log(filteredGroups, "lastMessage in UI");

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Groups
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-10 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* GROUP LIST */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading groups...
          </div>
        ) : filteredGroups?.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No groups yet</div>
        ) : (
          filteredGroups
            ?.filter((chat) => chat.type === "group")
            .map((group) => (
              <Link
                key={group.chatId}
                to={`/group/${group.chatId}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700/50"
              >
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full overflow-hidden bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-semibold">
                  {group.profile_img ? (
                    <img
                      src={`${API_BASE_URL}${group.profile_img}`}
                      alt={group.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{group.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Middle Content */}
                <div className="flex-1 min-w-0">
                  {/* Top Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {group.name}
                    </span>

                    {group.lastMessageAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(group.lastMessageAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Last Message */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {group.lastMessage
                      ? group.lastMessage.senderId === currentUser?.id
                        ? `You: ${group.lastMessage.text}`
                        : `${group.lastMessage.senderName}: ${group.lastMessage.text}`
                      : "No messages yet"}
                  </p>

                  {/* Members Count */}
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {group.memberCount} members
                  </p>
                </div>

                {/* Unread Badge */}
                {group.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5">
                    {group.unreadCount > 9 ? "9+" : group.unreadCount}
                  </span>
                )}
              </Link>
            ))
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="w-full max-w-md sm:h-[43vw] h-1/2 sm:overflow-hidden  overflow-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X />
            </button>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Group
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Add a name and select members for your group.
            </p>

            {/* Group Photo */}
            <div className="flex justify-center mb-6">
              <label className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer hover:opacity-80 transition">
                {groupImage ? (
                  <img
                    src={URL.createObjectURL(groupImage)}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGroupImage(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {/* </div> */}
            </div>

            {/* Group Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-2 rounded-xl text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                rows={2}
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                className="w-full px-4 py-2 rounded-xl text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Add Members */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Members
              </label>

              {/* Search */}
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full mb-3 px-4 py-2 rounded-xl text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Selected Chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedMembers.map((id) => {
                    const user = users.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <div
                        key={id}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs flex items-center gap-2"
                      >
                        {user.username}
                        <span
                          className="cursor-pointer"
                          onClick={() => toggleMember(id)}
                        >
                          ✕
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* User List */}
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredUsers?.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        {user.username}
                      </span>
                    </div>

                    <div>
                      {selectedMembers.includes(user.id) ? (
                        <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition"
              >
                ✓ Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
