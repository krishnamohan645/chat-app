import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  Search,
  Loader2,
  Trash2,
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
  getAllGroupMembersThunk,
  leaveGroupThunk,
  removeGroupMemberThunk,
  updateGroupMemberCount,
} from "../features/groups/groupsSlice";
import {
  getMessages,
  sendMessageThunk,
  addMessage,
  searchMessages,
  deleteMessageForEveryoneThunk,
  deleteMessageForMeThunk,
  editMessageThunk,
  sendFileMessageThunk,
  sendStickerThunk,
} from "../features/messages/messagesSlice";
import { API_BASE_URL } from "../config/constants";
import AddMembersModal from "../components/AddMembersModal";
import debounce from "lodash/debounce";
import EmojiPicker from "emoji-picker-react";

const GroupChat = () => {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  const chatIdNum = Number(chatId);
  const navigate = useNavigate();

  const messages = useSelector(
    (state) => state.messages.byChat[Number(chatId)] ?? [],
  );

  const currentUser = useSelector((state) => state.user.user);
  const {
    groups = [],
    members = [],
    allMembers = [],
  } = useSelector((state) => state.group);
  const group = groups.find((g) => g.chatId === Number(chatId));

  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [messageMenuOpen, setMessageMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const messagesContainerRef = useRef(null);
  // const activeMessageRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const fileInputRef = useRef(null);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Check if current user has left the group
  const currentMembership = members.find(
    (m) => Number(m.userId) === Number(currentUser?.id),
  );

  const hasLeftGroup =
    currentMembership?.leftAt !== null &&
    currentMembership?.leftAt !== undefined;

  // File validation constants
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_FILES = 5;
  const ALLOWED_FILE_TYPES = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/quicktime", "video/webm"],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ],
    archive: ["application/zip", "application/x-rar-compressed"],
  };

  const validateFile = (file) => {
    const allAllowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is too large. Max size is 100MB.`;
    }

    if (!allAllowedTypes.includes(file.type)) {
      return `${file.name} is not a supported file type.`;
    }

    return null;
  };

  const getFileIcon = (file) => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word")) return "📝";
    if (type.includes("excel")) return "📊";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setFileError(null);

    if (selectedFiles.length + files.length > MAX_FILES) {
      setFileError(`You can only upload ${MAX_FILES} files at once.`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
    e.target.value = "";
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(
      selectedFiles.filter((_, index) => index !== indexToRemove),
    );
    setFileError(null);
  };

  const amIAdmin =
    members.find((m) => Number(m.userId) === Number(currentUser?.id))?.role ===
    "admin";

  const isMember = members.some(
    (m) => Number(m.userId) === Number(currentUser?.id),
  );

  // ─── Sender name: check allMembers first (includes left), then active members ───
  const getSenderName = (senderId, senderNameFromMsg) => {
    const id = Number(senderId);
    const fromAll = allMembers?.find((m) => Number(m.userId) === id);
    if (fromAll?.user?.username) return fromAll.user.username;
    const fromActive = members?.find((m) => Number(m.userId) === id);
    if (fromActive?.user?.username) return fromActive.user.username;
    return senderNameFromMsg || "Unknown";
  };

  const getSenderImg = (senderId) => {
    const id = Number(senderId);
    const fromAll = allMembers?.find((m) => Number(m.userId) === id);
    if (fromAll?.user?.profile_img) return fromAll.user.profile_img;
    const fromActive = members?.find((m) => Number(m.userId) === id);
    return fromActive?.user?.profile_img ?? null;
  };

  // ─── Split allMembers into active vs left for the modal ───────────────────
  const activeModalMembers = [...(members ?? [])].sort((a, b) => {
    if (a.role === "admin") return -1;
    if (b.role === "admin") return 1;
    return 0;
  });

  // Left members: in allMembers but NOT in active members list
  const activeMemberIds = new Set(members.map((m) => Number(m.userId)));
  const leftMembers = allMembers.filter(
    (m) => !activeMemberIds.has(Number(m.userId)),
  );

  // Debounced search
  const debouncedSearch = useRef(
    debounce((chatId, query) => {
      if (!query.trim() || query.trim().length < 2) {
        return;
      }

      dispatch(searchMessages({ chatId, query: query.trim() }));
    }, 300),
  ).current;

  // Effects
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (!chatId) return;

    // ✅ Reset pagination state when switching chats
    setOffset(0);
    offsetRef.current = 0;
    setHasMore(true);
    hasMoreRef.current = true;

    dispatch(setOpenedChatId(Number(chatId)));

    // ✅ Pass limit: 20, offset: 0 for initial load
    dispatch(getMessages({ chatId: chatIdNum, limit: 20, offset: 0 }))
      .unwrap()
      .then((result) => {
        if (result.length < 20) {
          setHasMore(false);
          hasMoreRef.current = false;
        }
      })
      .catch(() => {});

    dispatch(getGroupMembersThunk(chatId));
    dispatch(getAllGroupMembersThunk(chatId));
    dispatch(resetUnread(Number(chatId)));

    if (socket) {
      socket.emit("join-chat", chatIdNum);
    }

    return () => {
      if (socket) {
        socket.emit("leave-chat", chatIdNum);
        socket.emit("typing:stop", { chatId: chatIdNum });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [chatId, chatIdNum, dispatch, socket]);

  // ─── Set active chat when group loads ───────────────────────────────────
  useEffect(() => {
    if (group) {
      dispatch(setActiveChat(group));
    }
  }, [group, dispatch]);

  // ─── Auto-scroll to bottom ──────────────────────────────────────────────
  useEffect(() => {
    if (!isLoadingMoreRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ─── Click outside handler for dropdown ─────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest(".dropdown-container")) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  // ─── Focus search input when search mode opens ──────────────────────────
  useEffect(() => {
    if (searchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  };

  // ─── Send — clear input immediately, fire API in background ─────────────
  const handleSend = async () => {
    const trimmed = message.trim();

    // Don't send if no content
    if (!trimmed && selectedFiles.length === 0) return;

    // Prevent double-send
    if (isSending) return;

    // Store values before clearing
    const messageContent = trimmed;
    const filesToSend = [...selectedFiles];

    // Clear UI immediately for instant feedback
    setMessage("");
    setSelectedFiles([]);
    setFileError(null);

    if (socket) {
      socket.emit("typing:stop", { chatId: chatIdNum });
      setIsTyping(false);
    }

    // Show loader
    setIsSending(true);
    console.log("✅ isSending set to TRUE"); // Debug log

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    // Stop typing indicator
    if (socket) {
      socket.emit("typing:stop", { chatId: chatIdNum });
    }

    try {
      // Send text message if exists
      if (messageContent) {
        console.log("📤 Sending text message..."); // Debug log
        await dispatch(
          sendMessageThunk({ chatId: chatIdNum, content: messageContent }),
        ).unwrap();
        console.log("✅ Text message sent"); // Debug log
      }

      // Send files if exist
      if (filesToSend.length > 0) {
        console.log("📤 Sending files..."); // Debug log
        await dispatch(
          sendFileMessageThunk({
            chatId: chatIdNum,
            files: filesToSend,
          }),
        ).unwrap();
        console.log("✅ Files sent"); // Debug log
      }
    } catch (err) {
      console.error("❌ Failed to send:", err);

      // Restore content on failure
      if (messageContent) setMessage(messageContent);
      if (filesToSend.length > 0) setSelectedFiles(filesToSend);
      setFileError("Failed to send. Please try again.");
    } finally {
      // Always hide loader
      setIsSending(false);
      console.log("✅ isSending set to FALSE"); // Debug log
    }
  };

  useEffect(() => {
    console.log("Group updated:", group?.memberCount);
  }, [group?.memberCount]);

  const handleOpenMessageMenu = (e, msgId) => {
    e.stopPropagation();

    // Toggle off
    if (messageMenuOpen === msgId) {
      setMessageMenuOpen(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_HEIGHT = 170; // approx height of menu

    // Decide open direction based on viewport space
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < MENU_HEIGHT
        ? rect.top - MENU_HEIGHT - 4 // open UPWARD
        : rect.bottom + 4; // open DOWNWARD

    // Align to right edge of button, keep inside viewport
    const right = Math.max(8, window.innerWidth - rect.right);

    setMenuPosition({ top, right });
    setMessageMenuOpen(msgId);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await dispatch(leaveGroupThunk(chatIdNum)).unwrap();
      setDropdownOpen(false);
      navigate("/groups", { replace: true });
    } catch (err) {
      console.error("Failed to leave group:", err);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(chatIdNum, value);
  };

  const closeSearch = () => {
    setSearchMode(false);
    setSearchText("");
  };

  const highlightText = (text) => {
    if (!searchText || !text) return text;

    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");

    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === searchText.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 text-black">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  const handleDeleteMessageForEveryone = (messageId) => {
    dispatch(deleteMessageForEveryoneThunk({ chatId: chatIdNum, messageId }));
    setMessageMenuOpen(null);
  };

  const handleDeleteMessageForMe = (messageId) => {
    dispatch(deleteMessageForMeThunk({ chatId: chatIdNum, messageId }));
    setMessageMenuOpen(null);
  };

  const canEditMessage = (msg) => {
    if (!msg.createdAt) return false;

    const createdTime = new Date(msg.createdAt).getTime();
    const now = Date.now();

    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    return now - createdTime <= FIFTEEN_MINUTES;
  };

  const handleEditMessage = () => {
    if (!editText.trim()) return;

    dispatch(
      editMessageThunk({
        chatId: chatIdNum,
        messageId: editingMessage.id,
        content: editText,
      }),
    );

    setEditModalOpen(false);
    setEditingMessage(null);
    setEditText("");
  };

  const loadMoreMessages = useCallback(async () => {
    // ✅ Use ref for guard — avoids stale closure issue
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const previousScrollHeight = container.scrollHeight;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    // ✅ Use ref value for offset — always current
    const nextOffset = offsetRef.current + 20;

    try {
      const result = await dispatch(
        getMessages({
          chatId: chatIdNum,
          limit: 20,
          offset: nextOffset,
        }),
      ).unwrap();

      // ✅ Update both ref and state
      offsetRef.current = nextOffset;
      setOffset(nextOffset);

      if (result.length < 20) {
        hasMoreRef.current = false;
        setHasMore(false);
      }

      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeight;
        container.scrollTop = scrollDiff; // ✅ Restore position relative to old content
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      });
    } catch (err) {
      console.error("Load more failed:", err);
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [chatIdNum, dispatch]); // ✅ Only stable deps — offset/hasMore read from refs

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop <= 5) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, [offset, hasMore, isLoadingMore, loadMoreMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;

      setShowScrollDown(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const typingUsers = useSelector((state) => {
    const users = state.chats.typingUsers;
    return users[Number(chatId)] || users[String(chatId)] || [];
  });
  // ✅ Filter out current user and get their names
  const typingUserNames = typingUsers
    .filter((userId) => Number(userId) !== Number(currentUser?.id))
    .map((userId) => {
      const id = Number(userId);
      const fromAll = allMembers?.find((m) => Number(m.userId) === id);
      if (fromAll?.user?.username) return fromAll.user.username;
      const fromActive = members?.find((m) => Number(m.userId) === id);
      return fromActive?.user?.username || "Someone";
    });

  const isSomeoneTyping = typingUserNames.length > 0;

  if (!group) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[91vh] flex flex-col bg-white dark:bg-gray-900">
      {/* ───── Header ───── */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/groups">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
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
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 h-4">
              {isSomeoneTyping ? (
                <span className="flex items-center gap-1 text-green-500">
                  {typingUserNames.length === 1
                    ? `${typingUserNames[0]} is typing`
                    : typingUserNames.length === 2
                      ? `${typingUserNames[0]} and ${typingUserNames[1]} are typing`
                      : `${typingUserNames[0]}, ${typingUserNames[1]} and ${typingUserNames.length - 2} others are typing`}
                  <span className="flex gap-1 ml-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:.2s]"></span>
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:.4s]"></span>
                  </span>
                </span>
              ) : (
                `${group.memberCount} members`
              )}
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
          <div className="relative dropdown-container">
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((p) => !p);
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
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setSearchMode(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" /> Search in Conversation
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                  Mute Notifications
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                {isMember && (
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Leave Group
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── Search Bar ───── */}
      {searchMode && (
        <div className="bg-blue-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search messages..."
            className="flex-1 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={closeSearch}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ───── Members Modal ───── */}
      {showMembers && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
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

            <div className="flex-1 overflow-y-auto">
              {/* ── Active Members ── */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Members · {activeModalMembers.length}
                </p>
                <div className="space-y-1">
                  {activeModalMembers
                    .filter((m) => m.userId !== undefined)
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
                                  {member.user?.username
                                    ?.charAt(0)
                                    .toUpperCase()}
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
              </div>

              {/* ── Past Members (Left) ── */}
              {leftMembers.length > 0 && (
                <div className="px-4 pt-2 pb-4 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Left · {leftMembers.length}
                  </p>
                  <div className="space-y-1">
                    {leftMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-2 rounded-lg opacity-60"
                      >
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {member.user?.profile_img ? (
                            <img
                              src={`${API_BASE_URL}${member.user.profile_img}`}
                              alt={member.user?.username}
                              className="h-full w-full object-cover rounded-full grayscale"
                            />
                          ) : (
                            <span>
                              {member.user?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            {member.user?.username}
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500 italic">
                              Left
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* ───── Messages ───── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="text-center text-xs text-gray-400 py-1">
            No more messages
          </div>
        )}
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-10">
            No messages yet. Say hello! 👋
          </div>
        )}

        {messages.map((msg) => {
          // ✅ System messages — centered pill, persisted in DB
          if (msg.type === "system") {
            return (
              <div key={msg.id} className="flex justify-center my-2 px-4">
                <span className="bg-gray-200/80 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-xs px-4 py-1.5 rounded-full text-center max-w-xs">
                  {highlightText(msg.content)}
                </span>
              </div>
            );
          }

          const isMine = Number(msg.senderId) === Number(currentUser?.id);
          const senderName = getSenderName(msg.senderId, msg.senderName);
          const senderImg = getSenderImg(msg.senderId);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 group ${isMine ? "justify-end" : "justify-start"}`}
            >
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
                className={`relative max-w-[65%] min-w-0 flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                {isMine && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMessageMenu(e, msg.id);
                    }}
                    className="absolute -top-2 right-0 p-1 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-700 rounded-full shadow text-gray-500"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                )}

                {!isMine && (
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 px-1 mb-0.5 truncate max-w-full">
                    {senderName}
                  </p>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm break-words w-full ${
                    isMine
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                  }`}
                >
                  {/* System messages */}
                  {msg.type === "system" && <span>{msg.content}</span>}

                  {/* Sticker */}
                  {msg.type === "sticker" && (
                    <span className="text-5xl">{msg.content}</span>
                  )}

                  {/* Text */}
                  {msg.type === "text" &&
                    highlightText(msg.content ?? msg.text ?? "")}

                  {/* Image */}
                  {msg.type === "image" && msg.fileUrl && (
                    <img
                      src={`${API_BASE_URL}${msg.fileUrl}`}
                      alt={msg.fileName || "uploaded image"}
                      className="max-w-full max-h-96 rounded-lg cursor-pointer"
                      onClick={() =>
                        window.open(`${API_BASE_URL}${msg.fileUrl}`, "_blank")
                      }
                    />
                  )}

                  {/* Video */}
                  {msg.type === "video" && msg.fileUrl && (
                    <video controls className="max-w-full max-h-96 rounded-lg">
                      <source
                        src={`${API_BASE_URL}${msg.fileUrl}`}
                        type={msg.mimeType}
                      />
                    </video>
                  )}

                  {/* Audio */}
                  {msg.type === "audio" && msg.fileUrl && (
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-2xl">🎵</span>
                      <audio controls className="flex-1">
                        <source
                          src={`${API_BASE_URL}${msg.fileUrl}`}
                          type={msg.mimeType}
                        />
                      </audio>
                    </div>
                  )}

                  {/* Document/File */}
                  {(msg.type === "document" || msg.type === "file") &&
                    msg.fileUrl && (
                      <a
                        href={`${API_BASE_URL}${msg.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-3 rounded-lg hover:opacity-80`}
                      >
                        <span className="text-2xl">
                          {msg.mimeType?.includes("pdf") ? "📄" : "📎"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {msg.fileName || "Download file"}
                          </p>
                          {msg.fileSize && (
                            <p className="text-xs opacity-70">
                              {formatFileSize(msg.fileSize)}
                            </p>
                          )}
                        </div>
                      </a>
                    )}

                  {msg.isEdited && (
                    <span className="text-[9px] ml-2 opacity-70">edited</span>
                  )}
                </div>
                <div
                  className={`flex items-center gap-1 text-xs text-gray-400 px-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}
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
                      <CheckCheck className="h-3 w-3 text-gray-400" />
                    ) : (
                      <Check className="h-3 w-3 text-gray-400" />
                    ))}
                </div>

                {/* MENU */}
                {messageMenuOpen === msg.id && (
                  <div
                    style={{
                      position: "fixed",
                      top: menuPosition.top,
                      right: menuPosition.right,
                      zIndex: 9999,
                    }}
                    className="w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isMine &&
                      msg.type === "text" &&
                      !msg.isDeleted &&
                      canEditMessage(msg) && (
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setEditText(msg.content);
                            setEditModalOpen(true);
                            setMessageMenuOpen(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      )}

                    {isMine && msg.type === "text" && !canEditMessage(msg) && (
                      <div className="px-4 py-2 text-xs text-gray-400">
                        Edit time expired
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteMessageForMe(msg.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete for me
                    </button>

                    {isMine && (
                      <button
                        onClick={() => handleDeleteMessageForEveryone(msg.id)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete for everyone
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />

        {isSomeoneTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex flex-col gap-1">
              {/* Show who is typing */}
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                {typingUserNames.length === 1
                  ? typingUserNames[0]
                  : typingUserNames.length === 2
                    ? `${typingUserNames[0]} and ${typingUserNames[1]}`
                    : `${typingUserNames[0]}, ${typingUserNames[1]} and ${typingUserNames.length - 2} others`}
              </p>
              {/* Typing dots */}
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-2xl rounded-bl-md max-w-[60%]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:.2s]"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:.4s]"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showScrollDown && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowScrollDown(false);
            }}
            className="absolute bottom-24 left-[58vw] -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>

      {/* ───── Input ───── */}
      {isMember && (
        <div className="flex-col p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          {/* File Error */}
          {fileError && (
            <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
              <span>{fileError}</span>
              <button onClick={() => setFileError(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-2 space-y-1">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl">{getFileIcon(file)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 text-gray-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sticker Picker */}
          {showStickerPicker && (
            <div className="absolute bottom-20 left-4 z-50">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  dispatch(
                    sendStickerThunk({
                      chatId: chatIdNum,
                      stickerUrl: emojiData.emoji,
                    }),
                  );
                  setShowStickerPicker(false);
                }}
                theme="dark"
                height={400}
                width={300}
              />
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
            >
              <Smile className="h-5 w-5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0"
              disabled={isSending}
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            />

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  const value = e.target.value;
                  setMessage(value);

                  // ✅ Handle typing indicator
                  if (!socket) return;

                  // Start typing when user types
                  if (!isTyping && value.trim()) {
                    socket.emit("typing:start", { chatId: chatIdNum });
                    setIsTyping(true);
                  }

                  // Clear previous timeout
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }

                  // Stop typing after 1.5s of inactivity
                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit("typing:stop", { chatId: chatIdNum });
                    setIsTyping(false);
                  }, 1500);

                  // Stop typing immediately if input is empty
                  if (!value.trim()) {
                    socket.emit("typing:stop", { chatId: chatIdNum });
                    setIsTyping(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                onInput={handleTextareaInput}
                placeholder="Type a message..."
                rows={1}
                disabled={isSending}
                style={{ minHeight: "40px", maxHeight: "128px" }}
                className="w-full resize-none overflow-y-auto bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-5 disabled:opacity-60"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={
                (!message.trim() && selectedFiles.length === 0) || isSending
              }
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {showAddMembers && (
        <AddMembersModal
          chatId={Number(chatId)}
          currentMembers={members}
          onClose={() => setShowAddMembers(false)}
        />
      )}

      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-80">
            <h3 className="text-sm font-semibold mb-2">Edit Message</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMessage}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
