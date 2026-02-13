import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  CheckCheck,
  Search,
  X,
  Loader2,
  Check,
  Trash2,
  Edit2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import {
  clearSearchResults,
  deleteMessageForEveryoneThunk,
  deleteMessageForMeThunk,
  editMessageThunk,
  getMessages,
  markMessagesAsRead,
  searchMessages,
  sendFileMessageThunk,
  sendMessageThunk,
  sendStickerThunk,
} from "../features/messages/messagesSlice";
import {
  resetUnread,
  setActiveChat,
  setOpenedChatId,
} from "../features/chats/chatSlice";
import { API_BASE_URL } from "../config/constants";
import "./styles.css";
import { getSocket } from "../socket/socket";
import EmojiPicker from "emoji-picker-react";

const Chat = () => {
  const { chatId } = useParams();
  const chatIdNum = Number(chatId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { chats, activeChat } = useSelector((state) => state.chats);
  const messages = useSelector((state) => state.messages.byChat[chatIdNum]);
  const myUserId = useSelector((state) => state.user?.user?.id);
  const searchResults = useSelector(
    (state) => state.messages.searchResults?.[chatIdNum],
  );

  const typingUsers = useSelector((state) => {
    const users = state.chats.typingUsers;
    return users[Number(chatIdNum)] || users[String(chatIdNum)] || [];
  });

  const isSomeoneTyping =
    typingUsers && typingUsers.some((id) => id !== myUserId);

  // State declarations
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState(null);
  const [dropdownDirection, setDropdownDirection] = useState("down");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeMessageRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // File validation constants
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_FILES = 5;
  const ALLOWED_FILE_TYPES = {
    image: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ],
    video: [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
    ],
    audio: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
    ],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ],
    archive: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-zip-compressed",
    ],
  };

  const displayedMessages =
    searchQuery.trim().length >= 2 ? (searchResults ?? []) : (messages ?? []);

  const showNoResults =
    searchQuery.trim().length >= 2 &&
    searchResults &&
    searchResults.length === 0;

  // ✅ FIXED: File utility functions
  const validateFile = (file) => {
    // ✅ Flatten all allowed types into one array
    const allAllowedTypes = [
      ...ALLOWED_FILE_TYPES.image,
      ...ALLOWED_FILE_TYPES.video,
      ...ALLOWED_FILE_TYPES.audio,
      ...ALLOWED_FILE_TYPES.document,
      ...ALLOWED_FILE_TYPES.archive,
    ];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is too large. Max size is 100MB.`;
    }

    // Check file type
    if (!allAllowedTypes.includes(file.type)) {
      return `${file.name} is not a supported file type.`;
    }

    return null;
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

  const getFileIcon = (file) => {
    const type = file.type.toLowerCase();

    // Images
    if (type.startsWith("image/")) {
      if (type.includes("gif")) return "🎞️";
      return "🖼️";
    }

    // Videos
    if (type.startsWith("video/")) {
      return "🎥";
    }

    // Audio
    if (type.startsWith("audio/")) {
      return "🎵";
    }

    // Documents
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("excel") || type.includes("sheet")) return "📊";
    if (type.includes("powerpoint") || type.includes("presentation"))
      return "📽️";
    if (type.includes("text")) return "📃";
    if (type.includes("csv")) return "📈";

    // Archives
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

  // Debounced search
  const debouncedSearch = useRef(
    debounce((chatId, query) => {
      if (!query.trim() || query.trim().length < 2) {
        setIsSearching(false);
        return;
      }

      dispatch(searchMessages({ chatId, query: query.trim() })).finally(() =>
        setIsSearching(false),
      );
    }, 300),
  ).current;

  // Effects
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (!activeChat && chats.length) {
      const chat = chats.find((c) => c.chatId === chatIdNum);
      if (chat) dispatch(setActiveChat(chat));
    }
  }, [activeChat, chats, chatIdNum, dispatch]);

  useEffect(() => {
    if (!chatIdNum) return;

    setOffset(0);
    setHasMore(true);

    dispatch(setOpenedChatId(chatIdNum));
    dispatch(resetUnread(chatIdNum));

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-chat", chatIdNum);
    dispatch(getMessages({ chatId: chatIdNum }));
    dispatch(markMessagesAsRead(chatIdNum));
    socket.emit("messages-read", { chatId: chatIdNum });

    return () => {
      socket.emit("leave-chat", chatIdNum);
      socket.emit("typing:stop", { chatId: chatIdNum });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      dispatch(setOpenedChatId(null));
    };
  }, [dispatch, chatIdNum]);

  useEffect(() => {
    if (!chatIdNum || !messages?.length) return;

    const socket = getSocket();
    if (!socket) return;

    dispatch(markMessagesAsRead(chatIdNum));
    socket.emit("messages-read", { chatId: chatIdNum });
  }, [messages?.length, chatIdNum, dispatch]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      dispatch(clearSearchResults(chatIdNum));
      setIsSearching(false);
      debouncedSearch.cancel();
      return;
    }

    if (searchQuery.trim().length < 2) {
      setIsSearching(false);
      debouncedSearch.cancel();
      return;
    }

    setIsSearching(true);
    debouncedSearch(chatIdNum, searchQuery);
  }, [searchQuery, chatIdNum, dispatch, debouncedSearch]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [chatIdNum]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  useEffect(() => {
    const handleClickOutside = () => setMessageMenuOpen(null);
    if (messageMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [messageMenuOpen]);

  useEffect(() => {
    if (!messageMenuOpen) return;

    const container = messagesContainerRef.current;
    const messageEl = activeMessageRef.current;

    if (!container || !messageEl) return;

    const containerRect = container.getBoundingClientRect();
    const messageRect = messageEl.getBoundingClientRect();
    const spaceBelow = containerRect.bottom - messageRect.bottom;

    if (spaceBelow < 160) {
      setDropdownDirection("up");
    } else {
      setDropdownDirection("down");
    }
  }, [messageMenuOpen]);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;

    // Only auto scroll if user is already near bottom
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [offset, hasMore, isLoadingMore]);

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

  // Handlers
  const handleViewProfile = () => {
    if (activeChat.type === "group") return;
    navigate(`/profile/${activeChat.otherUserId}`);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setIsSearching(false);
    debouncedSearch.cancel();
    dispatch(clearSearchResults(chatIdNum));
  };

  const handleOpenSearch = () => {
    setSearchOpen(true);
    setDropdownOpen(false);
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || isSending) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("typing:stop", { chatId: chatIdNum });
    }

    const messageContent = message.trim();
    const filesToSend = [...selectedFiles];

    setMessage("");
    setSelectedFiles([]);
    setFileError(null);
    setIsSending(true);
    setIsTyping(false);

    try {
      if (messageContent) {
        await dispatch(
          sendMessageThunk({ chatId: chatIdNum, content: messageContent }),
        ).unwrap();
      }

      if (filesToSend.length > 0) {
        await dispatch(
          sendFileMessageThunk({
            chatId: chatIdNum,
            files: filesToSend,
          }),
        ).unwrap();
      }
    } catch (err) {
      console.error("Failed to send:", err);
      if (messageContent) setMessage(messageContent);
      if (filesToSend.length > 0) setSelectedFiles(filesToSend);
      setFileError("Failed to send. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessageForEveryone = (messageId) => {
    dispatch(deleteMessageForEveryoneThunk({ chatId: chatIdNum, messageId }));
    setMessageMenuOpen(null);
  };

  const handleDeleteMessageForMe = (messageId) => {
    dispatch(deleteMessageForMeThunk({ chatId: chatIdNum, messageId }));
    setMessageMenuOpen(null);
  };

  const loadMoreMessages = () => {
    if (isLoadingMore || !hasMore) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const previousHeight = container.scrollHeight;

    setIsLoadingMore(true);

    const nextOffset = offset + 20; // Assuming page size of 20

    const result = dispatch(
      getMessages({ chatId: chatIdNum, limit: 20, offset: nextOffset }),
    ).unwrap();

    if (result.length < 20) {
      setHasMore(false);
    }

    setOffset(nextOffset);
    setIsLoadingMore(false);

    setTimeout(() => {
      const newHeight = container.scrollHeight;
      container.scrollTop = newHeight - previousHeight;
    }, 0); // Wait for messages to render
  };

  if (!activeChat) return null;

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[43vw] flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/chats">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>

          <div className="relative h-10 w-10">
            {activeChat.profile_img ? (
              <img
                src={`${API_BASE_URL}${activeChat.profile_img}`}
                alt={activeChat.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {activeChat.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {activeChat.name}
            </h2>
            <p className="text-xs text-gray-400 flex items-center gap-2 h-4">
              {isSomeoneTyping ? (
                <span className="flex items-center gap-1 text-green-400">
                  typing
                  <span className="flex gap-1 ml-1">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-bounce [animation-delay:.2s]"></span>
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-bounce [animation-delay:.4s]"></span>
                  </span>
                </span>
              ) : activeChat.isOnline ? (
                "Online"
              ) : activeChat.lastSeen ? (
                `Last seen ${new Date(activeChat.lastSeen).toLocaleTimeString()}`
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Video className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={handleViewProfile}
                  className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  View Profile
                </button>
                <button
                  onClick={handleOpenSearch}
                  className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Search in Conversation
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  Mute Notifications
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg">
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= SEARCH BAR ================= */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50 dark:bg-gray-800">
          <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages (min 2 characters)..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          <button
            onClick={handleCloseSearch}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      )}

      {searchOpen &&
        searchQuery.trim().length > 0 &&
        searchQuery.trim().length < 2 && (
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            Type at least 2 characters to search
          </div>
        )}

      {/* ================= MESSAGES ================= */}
      <div
        ref={messagesContainerRef}
        className="relative overflow-y-auto flex-1 px-4 pt-4 pb-1 space-y-2"
      >
        {showNoResults && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No messages found for "{searchQuery}"
              </p>
            </div>
          </div>
        )}

        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {displayedMessages?.map((msg) => {
          const isSent = msg.senderId === myUserId;
          const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex animate-fadeIn group ${
                isSent ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] space-y-1 ${isSent ? "items-end" : "items-start"}`}
              >
                <div
                  ref={(el) => {
                    if (messageMenuOpen === msg.id) {
                      activeMessageRef.current = el;
                    }
                  }}
                  className={`px-4 py-2 rounded-2xl relative ${
                    msg.type === "system"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 italic text-center"
                      : isSent
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                  }`}
                >
                  {msg.type !== "system" && isSent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageMenuOpen(
                          messageMenuOpen === msg.id ? null : msg.id,
                        );
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-gray-200 dark:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                    </button>
                  )}
                  {/* Message content rendering */}
                  {msg.type === "system" && <span>{msg.content}</span>}{" "}
                  {msg.type === "sticker" && (
                    <span className="text-5xl">{msg.content}</span>
                  )}
                  {msg.type === "text" && msg.content}
                  {/* Image */}
                  {msg.type === "image" && msg.fileUrl && (
                    <img
                      src={`${API_BASE_URL}${msg.fileUrl}`}
                      alt={msg.fileName || "uploaded image"}
                      className="max-w-full max-h-96 rounded-lg cursor-pointer"
                      onClick={() =>
                        window.open(`${API_BASE_URL}${msg.fileUrl}`, "_blank")
                      }
                      onError={(e) => {
                        console.error("Failed to load image:", msg.fileUrl);
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  {/* Video */}
                  {msg.type === "video" && msg.fileUrl && (
                    <video
                      controls
                      className="max-w-full max-h-96 rounded-lg"
                      onError={() => {
                        console.error("Failed to load video:", msg.fileUrl);
                      }}
                    >
                      <source
                        src={`${API_BASE_URL}${msg.fileUrl}`}
                        type={msg.mimeType}
                      />
                      Your browser does not support the video tag.
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
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  )}
                  {/* Document or File */}
                  {(msg.type === "document" || msg.type === "file") &&
                    msg.fileUrl && (
                      <a
                        href={`${API_BASE_URL}${msg.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-3 rounded-lg hover:opacity-80 transition-opacity ${
                          isSent
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        }`}
                      >
                        <span className="text-2xl">
                          {msg.mimeType?.includes("pdf")
                            ? "📄"
                            : msg.mimeType?.includes("word")
                              ? "📝"
                              : msg.mimeType?.includes("excel")
                                ? "📊"
                                : msg.mimeType?.includes("powerpoint")
                                  ? "📽️"
                                  : msg.mimeType?.includes("zip")
                                    ? "📦"
                                    : "📎"}
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
                        <span className="text-xl">⬇️</span>
                      </a>
                    )}
                  {msg.isEdited && (
                    <span className="text-[9px] ml-2 opacity-70">edited</span>
                  )}
                  {msg.type !== "system" && (
                    <div
                      className={`flex items-center gap-1 text-[10px] px-1 mt-1 ${
                        isSent
                          ? "justify-end text-blue-100"
                          : "justify-start text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10px] mt-1 opacity-80">
                        {msg.isEdited && <span>Edited</span>}
                        <span>{timestamp}</span>
                      </div>

                      {isSent && (
                        <div className="flex items-center gap-1">
                          {msg.status === "sent" && (
                            <Check className="h-3 w-3 text-gray-400" />
                          )}
                          {msg.status === "delivered" && (
                            <CheckCheck className="h-3 w-3 text-gray-400" />
                          )}
                          {msg.status === "read" && (
                            <CheckCheck className="h-3 w-3 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {messageMenuOpen === msg.id && (
                    <div
                      className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50
                      ${
                        dropdownDirection === "up"
                          ? "bottom-full mb-1"
                          : "top-full mt-1"
                      }`}
                    >
                      {isSent && msg.type === "text" && (
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setEditText(msg.content);
                            setEditModalOpen(true);
                            setMessageMenuOpen(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => {
                          handleDeleteMessageForMe(msg.id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete for me
                      </button>

                      {isSent && (
                        <button
                          onClick={() => {
                            handleDeleteMessageForEveryone(msg.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete for everyone
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />

        {typingUsers.length > 0 && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-2xl rounded-bl-md max-w-[60%]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:.2s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:.4s]"></span>
              </div>
            </div>
          </div>
        )}

        {!searchQuery && (!messages || messages.length === 0) && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        )}

        {showScrollDown && (
          <button
            onClick={() =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="absolute bottom-24 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all"
          >
            ↓
          </button>
        )}
      </div>

      {/* ================= INPUT ================= */}
      <div className="flex-col p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
        {/* File Error Message */}
        {fileError && (
          <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
            <span>{fileError}</span>
            <button
              onClick={() => setFileError(null)}
              className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showStickerPicker && (
          <div className="absolute bottom-20 left-4 z-50">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                dispatch(
                  sendStickerThunk({
                    chatId: chatIdNum,
                    stickerUrl: emojiData.emoji, // store emoji itself
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
            className="p-2 text-gray-500"
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
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
          />

          <input
            type="text"
            value={message}
            onChange={(e) => {
              const value = e.target.value;
              setMessage(value);

              const socket = getSocket();
              if (!socket) return;

              if (!isTyping && value.trim()) {
                socket.emit("typing:start", { chatId: chatIdNum });
                setIsTyping(true);
              }

              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }

              typingTimeoutRef.current = setTimeout(() => {
                socket.emit("typing:stop", { chatId: chatIdNum });
                setIsTyping(false);
              }, 1500);

              if (!value.trim()) {
                socket.emit("typing:stop", { chatId: chatIdNum });
                setIsTyping(false);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSendMessage}
            disabled={
              (!message.trim() && selectedFiles.length === 0) || isSending
            }
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingMessage(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
                <h3 className="text-white text-lg font-medium">Edit message</h3>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="flex justify-end mb-6">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-md">
                  <p className="text-sm">{editingMessage?.content}</p>
                  {editingMessage?.isEdited && (
                    <span className="text-xs text-blue-200 mt-1 block">
                      Edited
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-3">
                <button className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm10 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-5 5c2.14 0 3.92-1.5 4.38-3.5H7.62c.46 2 2.24 3.5 4.38 3.5z" />
                  </svg>
                </button>

                <div className="flex-grow bg-gray-800 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={1}
                    className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none"
                    placeholder="Type a message"
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!editText.trim()) return;
                    await dispatch(
                      editMessageThunk({
                        chatId: chatIdNum,
                        messageId: editingMessage.id,
                        content: editText.trim(),
                      }),
                    );
                    setEditModalOpen(false);
                    setEditingMessage(null);
                  }}
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
