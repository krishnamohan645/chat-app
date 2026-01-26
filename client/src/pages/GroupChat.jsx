import { useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";

const mockMembers = [
  {
    id: "1",
    name: "John Doe",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    role: "admin",
    online: true,
  },
  {
    id: "2",
    name: "Sarah Wilson",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    role: "member",
    online: true,
  },
  {
    id: "3",
    name: "Mike Johnson",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    role: "member",
    online: false,
  },
  {
    id: "4",
    name: "Emma Davis",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    role: "member",
    online: true,
  },
];

const mockMessages = [
  {
    id: "1",
    sender: "Sarah Wilson",
    senderAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    content: "Hey team! The new designs are ready for review.",
    timestamp: "10:00 AM",
    isSent: false,
    status: "read",
  },
  {
    id: "2",
    sender: "You",
    senderAvatar: "",
    content: "Great! I'll take a look at them now.",
    timestamp: "10:02 AM",
    isSent: true,
    status: "read",
  },
  {
    id: "3",
    sender: "Mike Johnson",
    senderAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    content: "The deployment is complete ✅",
    timestamp: "10:15 AM",
    isSent: false,
    status: "read",
  },
  {
    id: "4",
    sender: "Emma Davis",
    senderAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    content:
      "Amazing work everyone! Let's sync up tomorrow for the next sprint.",
    timestamp: "10:20 AM",
    isSent: false,
    status: "read",
  },
  {
    id: "5",
    sender: "You",
    senderAvatar: "",
    content: "Sounds good! I'll prepare the tickets.",
    timestamp: "10:25 AM",
    isSent: true,
    status: "delivered",
  },
];

const GroupChat = () => {
  // const { id } = useParams();
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const group = {
    name: "Dev Team",
    avatar:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
    memberCount: 4,
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/chats">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <img
              src={group.avatar}
              alt={group.name}
              className="h-full w-full object-cover"
            />
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {group.name.charAt(0)}
            </div>
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

          <Link to="/call/audio">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <Phone className="h-5 w-5" />
            </button>
          </Link>
          <Link to="/call/video">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <Video className="h-5 w-5" />
            </button>
          </Link>

          <div className="relative">
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Group Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  Search in Conversation
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                  Mute Notifications
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Leave Group
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Group Members
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {group.memberCount} members in {group.name}
                  </p>
                </div>
                <button
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  onClick={() => setShowMembers(false)}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="space-y-2 p-4 max-h-80 overflow-y-auto">
              {mockMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {member.name.charAt(0)}
                        </div>
                      </div>
                      {member.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-1">
                        {member.name}
                        {member.role === "admin" && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  {member.role !== "admin" && (
                    <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Members
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isSent ? "justify-end" : "justify-start"}`}
          >
            {!msg.isSent && (
              <div className="h-8 w-8 rounded-full overflow-hidden mr-2 shrink-0">
                <img
                  src={msg.senderAvatar}
                  alt={msg.sender}
                  className="h-full w-full object-cover"
                />
                <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {msg.sender.charAt(0)}
                </div>
              </div>
            )}
            <div
              className={`max-w-[70%] space-y-1 ${
                msg.isSent ? "items-end" : "items-start"
              }`}
            >
              {!msg.isSent && (
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 px-1">
                  {msg.sender}
                </p>
              )}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  msg.isSent
                    ? "bg-blue-500 text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
              <div
                className={`flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-1 ${
                  msg.isSent ? "justify-end" : "justify-start"
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.isSent &&
                  (msg.status === "read" ? (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  ) : msg.status === "delivered" ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
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

export default GroupChat;
