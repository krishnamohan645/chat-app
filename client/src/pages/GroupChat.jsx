import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Crown,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getSocket } from "../socket/socket";
import {
  resetUnread,
  setActiveChat,
  setOpenedChatId,
} from "../features/chats/chatSlice";
import {
  getGroupMembersThunk,
  removeGroupMemberThunk,
} from "../features/groups/groupsSlice";
import {
  getMessages,
  sendMessageThunk,
} from "../features/messages/messagesSlice";
import { API_BASE_URL } from "../config/constants";
import AddMembersModal from "../components/AddMembersModal";

const GroupChat = () => {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const chatIdNum = Number(chatId);

  const messages = useSelector(
    (state) => state.messages.byChat[Number(chatId)] ?? [],
  );
  // const { chats = [] } = useSelector((state) => state.chats);
  // const { members = [] } = useSelector((state) => state.group);
  const currentUser = useSelector((state) => state.user.user);
  console.log(currentUser, "currentUser in GroupChat");

  // const group = chats.find((c) => c.chatId === Number(chatId));
  const { groups = [], members = [] } = useSelector((state) => state.group);
  console.log(members, "members in GroupChat");
  const group = groups.find((g) => g.chatId === Number(chatId));

  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const amIAdmin =
    members.find((m) => Number(m.userId) === Number(currentUser?.id))?.role ===
    "admin";
  console.log(
    "amIAdmin:",
    amIAdmin,
    "currentUser.id:",
    currentUser?.id,
    "members:",
    members.map((m) => ({
      userId: m.userId,
      role: m.role,
      type: typeof m.userId,
    })),
  );
  useEffect(() => {
    if (!chatId) return;

    dispatch(setOpenedChatId(Number(chatId)));
    dispatch(setActiveChat(group));
    dispatch(getMessages({ chatId: chatIdNum }));
    dispatch(getGroupMembersThunk(chatId));
    dispatch(resetUnread(Number(chatId)));

    socket.emit("join-chat", chatId);

    return () => {
      socket.emit("leave-chat", chatId);
    };
  }, [chatId, dispatch]);

  useEffect(() => {
    if (group) dispatch(setActiveChat(group));
  }, [group, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  /* -------------------- SEND MESSAGE -------------------- */
  const handleSend = async () => {
    const socket = getSocket();
    if (!message.trim()) return;

    try {
      await dispatch(
        sendMessageThunk({
          chatId: chatIdNum,
          content: message,
        }),
      ).unwrap();
      setMessage("");

      // stop typing indicator
      if (socket) socket.emit("typing:stop", { chatId: chatIdNum });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // ✅ Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sortedMembers = [...(members ?? [])].sort((a, b) => {
    if (a.role === "admin") return -1;
    if (b.role === "admin") return 1;
    return 0;
  });

  // ✅ Guard: group may not be loaded yet
  if (!group) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[43vw] flex flex-col bg-white dark:bg-gray-900">
      {/* ───────────────── Header ───────────────── */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/groups">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>

          {/* Group Avatar */}
          <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-500 flex-shrink-0 flex items-center justify-center text-white font-semibold">
            {group.profile_img ? (
              <img
                src={`${API_BASE_URL}${group.profile_img}`}
                alt={group.name}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span>{group.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {group.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {group.memberCount} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setShowMembers(true)}
          >
            <Users className="h-5 w-5" />
          </button>

          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Video className="h-5 w-5" />
          </button>

          {/* Dropdown */}
          <div className="relative">
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((prev) => !prev);
              }}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Settings className="h-4 w-4" /> Group Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                  Search in Conversation
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                  Mute Notifications
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Leave Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────── Members Modal ───────────────── */}
      {showMembers && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Group Members
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {group.memberCount} members in {group.name}
                </p>
              </div>
              <button
                className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setShowMembers(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Members List — ✅ uses real `members` from Redux */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sortedMembers
                ?.filter((m) => m.userId !== undefined)
                .map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
                          {member.user?.profile_img ? (
                            <img
                              src={`${API_BASE_URL}${member.user.profile_img}`}
                              alt={member.user?.username}
                              className="h-full w-full object-cover rounded-full"
                            />
                          ) : (
                            <span>
                              {member.user?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {member.user?.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-1">
                          {member.user?.username}
                          {member.role === "admin" && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {member.role ?? "member"}
                        </p>
                      </div>
                    </div>

                    {member.role !== "admin" &&
                      amIAdmin &&
                      Number(member.userId) !== Number(currentUser?.id) && (
                        <button
                          onClick={() =>
                            dispatch(
                              removeGroupMemberThunk({
                                chatId,
                                userId: member.userId,
                              }),
                            )
                          }
                          className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          Remove
                        </button>
                      )}
                  </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowMembers(false);
                  setShowAddMembers(true);
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <UserPlus className="h-4 w-4" /> Add Members
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── Messages ───────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-10">
            No messages yet. Say hello! 👋
          </div>
        )}

        {messages.map((msg) => {
          // ✅ Use isMine consistently — NOT msg.isSent
          const isMine = msg.senderId === currentUser?.id;

          // Find sender info from members list
          const sender = members?.find((m) => m.userId === msg.senderId);
          const senderName =
            sender?.user?.username ?? msg.senderName ?? "Unknown";
          const senderImg = sender?.user?.profile_img ?? null;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
            >
              {/* ✅ Avatar on the LEFT for other users only */}
              {!isMine && (
                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {senderImg ? (
                    <img
                      src={`${API_BASE_URL}${senderImg}`}
                      alt={senderName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{senderName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              )}

              <div
                className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                {/* Sender name for others only */}
                {!isMine && (
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 px-1 mb-0.5">
                    {senderName}
                  </p>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl text-sm ${
                    isMine
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                  }`}
                >
                  {msg.content ?? msg.text}
                </div>

                {/* Timestamp + read status */}
                <div
                  className={`flex items-center gap-1 text-xs text-gray-400 px-1 mt-0.5 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : (msg.timestamp ?? "")}
                  </span>
                  {isMine &&
                    (msg.status === "read" ? (
                      <CheckCheck className="h-3 w-3 text-blue-400" />
                    ) : msg.status === "delivered" ? (
                      <CheckCheck className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ───────────────── Input ───────────────── */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
            <Smile className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown} // ✅ Enter to send
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {/* ✅ Send button wired to handleSend */}
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* --------------ADD MEMBER---------  */}
      {showAddMembers && (
        <AddMembersModal
          chatId={Number(chatId)}
          currentMembers={members}
          onClose={() => setShowAddMembers(false)}
        />
      )}
    </div>
  );
};

export default GroupChat;
