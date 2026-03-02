import { Phone, PhoneOff, Video } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearIncomingCall } from "../features/calls/callsSlice";
import { getSocket } from "../socket/socket";
import { API_BASE_URL } from "../config/constants";

const IncomingCallModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = getSocket();

  const { incomingCall } = useSelector((state) => state.calls);

  if (!incomingCall) return null;

  const { callId, callerId, type, callerInfo } = incomingCall;

  const handleAccept = () => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ ACCEPT BUTTON CLICKED");
    console.log("CallId:", callId);
    console.log("CallerId:", callerId);
    console.log("Type:", type);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    socket.emit("call:accept", { callId });
    dispatch(clearIncomingCall());

    const navUrl = `/call/${type}?callId=${callId}&receiverId=${callerId}&status=connected`;
    console.log("📍 Navigating to:", navUrl);

    navigate(navUrl, { replace: true }); // ✅ Added replace: true
  };

  const handleReject = () => {
    // Emit reject to backend
    socket.emit("call:reject", { callId });

    // Clear modal
    dispatch(clearIncomingCall());
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center animate-fadeIn shadow-2xl">
        {/* Caller Avatar */}
        <div className="mb-6">
          {callerInfo?.profile_img ? (
            <img
              // src={`${API_BASE_URL}${callerInfo.profile_img}`}
              src={callerInfo.profile_img}
              alt={callerInfo.username}
              className="h-24 w-24 rounded-full mx-auto object-cover ring-4 ring-blue-500/30 animate-pulse"
            />
          ) : (
            <div className="h-24 w-24 rounded-full mx-auto bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-500/30 animate-pulse">
              {callerInfo?.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Caller Name */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {callerInfo?.username || "Unknown"}
        </h2>

        {/* Call Type */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 flex items-center justify-center gap-2">
          {type === "video" ? (
            <>
              <Video className="h-4 w-4" />
              Incoming Video Call
            </>
          ) : (
            <>
              <Phone className="h-4 w-4" />
              Incoming Audio Call
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject */}
          <button
            onClick={handleReject}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          >
            <PhoneOff className="h-7 w-7" />
          </button>

          {/* Accept */}
          <button
            onClick={handleAccept}
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          >
            {type === "video" ? (
              <Video className="h-7 w-7" />
            ) : (
              <Phone className="h-7 w-7" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
