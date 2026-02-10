// import { useEffect, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   Phone,
//   Video,
//   MoreVertical,
//   Smile,
//   Paperclip,
//   Send,
//   Check,
//   CheckCheck,
// } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { getMessages } from "../features/messages/messagesSlice";
// import { API_BASE_URL } from "../config/constants";

// const mockMessages = [
//   {
//     id: "1",
//     content: "Hey! How are you doing?",
//     timestamp: "10:00 AM",
//     isSent: false,
//     status: "read",
//   },
//   {
//     id: "2",
//     content: "I'm great, thanks! Just finished the project.",
//     timestamp: "10:02 AM",
//     isSent: true,
//     status: "read",
//   },
//   {
//     id: "3",
//     content: "That's awesome! 🎉 Can you share the details?",
//     timestamp: "10:03 AM",
//     isSent: false,
//     status: "read",
//   },
//   {
//     id: "4",
//     content:
//       "Sure! I'll send you the documentation in a bit. The project includes all the features we discussed last week.",
//     timestamp: "10:05 AM",
//     isSent: true,
//     status: "read",
//   },
//   {
//     id: "5",
//     content: "Perfect! Looking forward to it.",
//     timestamp: "10:06 AM",
//     isSent: false,
//     status: "read",
//   },
//   {
//     id: "6",
//     content: "Are you coming to the party tonight?",
//     timestamp: "10:30 AM",
//     isSent: false,
//     status: "read",
//   },
//   {
//     id: "7",
//     content: "Yes! I'll be there around 8 PM",
//     timestamp: "10:32 AM",
//     isSent: true,
//     status: "delivered",
//   },
// ];

// const Chat = () => {
//   const { chatId } = useParams();
//   const chatIdNum = Number(chatId);
//   console.log(chatIdNum, "chatId");

//   const dispatch = useDispatch();

//   const messages = useSelector((state) => state.messages.byChat[chatIdNum]);
//   console.log(messages, "messages in chat.jsx");
//   console.log(chatId, "chatId in chat.jsx");
//   const activeChat = useSelector((state) => state.chats.activeChat);

//   console.log(activeChat, "activeChat user in chat.jsx");

//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     if (!chatId) return;
//     dispatch(getMessages({ chatId: chatIdNum }));
//   }, [dispatch, chatIdNum, chatId]);

//   const TypingIndicator = () => (
//     <div className="flex items-center gap-1 px-4 py-2">
//       <div className="bg-gray-100 dark:bg-gray-700 flex items-center gap-1 px-3 py-2 rounded-2xl rounded-bl-md max-w-[75%]">
//         <div
//           className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//           style={{ animationDelay: "0s" }}
//         />
//         <div
//           className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//           style={{ animationDelay: "0.2s" }}
//         />
//         <div
//           className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//           style={{ animationDelay: "0.4s" }}
//         />
//       </div>
//     </div>
//   );

//   return (
//     <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col bg-white dark:bg-gray-900">
//       {/* Header */}
//       <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
//         <div className="flex items-center gap-3">
//           <Link to="/chats">
//             <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden">
//               <ArrowLeft className="h-5 w-5" />
//             </button>
//           </Link>
//           <div className="relative h-10 w-10">
//             <img
//               src={`${API_BASE_URL}${activeChat?.profile_img}`}
//               alt={activeChat?.name}
//               className="h-full w-full rounded-full object-cover"
//             />
//             <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mt-[-8rem]">
//               {activeChat?.name.charAt(0)}
//             </div>
//           </div>
//           <div>
//             <h2 className="font-semibold text-gray-900 dark:text-white">
//               {activeChat?.name}
//             </h2>
//             <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
//               {activeChat?.isOnline && (
//                 <span className="w-2 h-2 bg-green-500 rounded-full" />
//               )}
//               {activeChat?.lastSeen}
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-1">
//           <Link to="/call/audio">
//             <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
//               <Phone className="h-5 w-5" />
//             </button>
//           </Link>
//           <Link to="/call/video">
//             <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
//               <Video className="h-5 w-5" />
//             </button>
//           </Link>
//           <div className="relative">
//             <button
//               className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//             >
//               <MoreVertical className="h-5 w-5" />
//             </button>

//             {dropdownOpen && (
//               <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
//                 <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-white dark:hover:bg-gray-700">
//                   View Profile
//                 </button>
//                 <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-white dark:hover:bg-gray-700">
//                   Search in Conversation
//                 </button>
//                 <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-white dark:hover:bg-gray-700">
//                   Mute Notifications
//                 </button>
//                 <button className="w-full px-4 py-2 text-left text-sm text-red-600  hover:bg-gray-100 dark:hover:bg-gray-700">
//                   Block User
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Messages */}

//       <div className="flex-1 overflow-y-auto p-4 space-y-2">
//         {messages?.map((msg) => (
//           <div
//             key={msg.id}
//             className={`flex animate-fadeIn ${
//               msg.isSent ? "justify-end" : "justify-start"
//             }`}
//           >
//             <div
//               className={`max-w-[75%] space-y-1 ${
//                 msg.isSent ? "items-end" : "items-start"
//               }`}
//             >
//               <div
//                 className={`px-4 py-2 rounded-2xl ${
//                   msg.isSent
//                     ? "bg-blue-500 text-white rounded-br-md"
//                     : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
//                 }`}
//               >
//                 {msg.content}
//               </div>
//               <div
//                 className={`flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-1 ${
//                   msg.isSent ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 <span>{msg.timestamp}</span>
//                 {msg.isSent &&
//                   (msg.status === "read" ? (
//                     <CheckCheck className="h-3 w-3 text-blue-500" />
//                   ) : msg.status === "delivered" ? (
//                     <CheckCheck className="h-3 w-3" />
//                   ) : (
//                     <Check className="h-3 w-3" />
//                   ))}
//               </div>
//             </div>
//           </div>
//         ))}

//         {/* {isTyping && <TypingIndicator />} */}
//       </div>

//       {/* Input */}
//       <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
//         <div className="flex items-center gap-2">
//           <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
//             <Smile className="h-5 w-5" />
//           </button>
//           <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white shrink-0">
//             <Paperclip className="h-5 w-5" />
//           </button>
//           <input
//             type="text"
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             placeholder="Type a message..."
//             className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shrink-0">
//             <Send className="h-5 w-5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Chat;

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMessages,
  markMessagesAsRead,
} from "../features/messages/messagesSlice";
import { setActiveChat } from "../features/chats/chatSlice";
import { API_BASE_URL } from "../config/constants";
import "./styles.css";
import { getSocket } from "../socket/socket";

const Chat = () => {
  const { chatId } = useParams();
  const chatIdNum = Number(chatId);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { chats, activeChat } = useSelector((state) => state.chats);
  const messages = useSelector((state) => state.messages.byChat[chatIdNum]);
  const myUserId = useSelector((state) => state.user?.user?.id);
  console.log(messages, "messages in chat.jsx");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState("");

  /* 🔁 Rehydrate activeChat on refresh */
  useEffect(() => {
    if (!activeChat && chats.length) {
      const chat = chats.find((c) => c.chatId === chatIdNum);
      if (chat) dispatch(setActiveChat(chat));
    }
  }, [activeChat, chats, chatIdNum, dispatch]);

  /* 📥 Fetch messages */
  useEffect(() => {
    if (!chatIdNum) return;
    dispatch(getMessages({ chatId: chatIdNum }));

    const socket = getSocket();
    if (!socket) return;

    // join chat room
    socket.emit("join-chat", chatIdNum);

    // mark read
    dispatch(markMessagesAsRead(chatIdNum));

    return () => {
      socket.emit("leave-chat", chatIdNum);
    };
  }, [dispatch, chatIdNum]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [chatIdNum]);

  /* ⛔ Guard (IMPORTANT) */
  if (!activeChat) return null;

  console.log(
    messages?.map((m) => m.senderId),
    "messages in chat.jsx",
  );
  console.log(myUserId, "myUserId in chat.jsx");

  const handleViewProfile = (chat) => {
    // ❗ Group chat → do NOT open user profile
    if (chat.type === "group") return;

    navigate(`/profile/${activeChat.otherUserId}`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-[43vw] flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
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
                {activeChat.name?.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {activeChat.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              {activeChat.isOnline && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
              {activeChat.isOnline
                ? "Online"
                : activeChat.lastSeen
                  ? `Last seen ${new Date(activeChat.lastSeen).toLocaleString()}`
                  : "Offline"}
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
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  View Profile
                </button>

                <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  Search in Conversation
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  Mute Notifications
                </button>
                <button className="w-full px-4 py-2 text-left text-sm  text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Block User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto flex-1  px-4 pt-4 pb-1 space-y-2 ">
        {messages?.map((msg) => {
          const isSent = msg.senderId === myUserId;
          const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex animate-fadeIn ${
                isSent ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] space-y-1 ${
                  isSent ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isSent
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                  }`}
                >
                  {msg.content}
                  <div
                    className={` flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 px-1 ml-[15vw] md:ml-[8vw] ${
                      isSent
                        ? "justify-end message-chat-time-sender"
                        : "justify-start message-chat-time-receiver"
                    }`}
                  >
                    <span>{timestamp}</span>
                    {isSent && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex-3 p-4  bg-white dark:bg-gray-800 border-t  border-gray-200 dark:border-gray-700 shrink-0">
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
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shrink-0">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
