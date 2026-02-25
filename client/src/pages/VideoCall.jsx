import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getSocket } from "../socket/socket";
import webrtcService from "../services/webrtc.service";
import {
  clearCurrentCall,
  toggleMute,
  toggleVideo,
  setCallStatus,
} from "../features/calls/callsSlice";
import { API_BASE_URL } from "../config/constants";

const VideoCall = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const socket = getSocket();
  const [searchParams] = useSearchParams();

  const receiverId = searchParams.get("receiverId");
  const callId = searchParams.get("callId");
  const status = searchParams.get("status"); // 'calling' or 'connected'

  const { callStatus, isMuted, isVideoOff } = useSelector(
    (state) => state.calls,
  );
  const chats = useSelector((state) => state.chats.chats);

  const [duration, setDuration] = useState(0);
  const [connecting, setConnecting] = useState(status === "calling");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Get other user info
  const otherUser = chats.find((c) => c.otherUserId === Number(receiverId));

  // Duration counter
  useEffect(() => {
    if (callStatus === "connected") {
      durationIntervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const cleanup = () => {
    webrtcService.destroy();
    dispatch(clearCurrentCall());

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    socket.off("webrtc:offer");
    socket.off("webrtc:answer");
  };

  const endCall = () => {
    socket.emit("call:end", { callId });
    cleanup();
    navigate("/chats");
  };

  const initCall = async () => {
    try {
      console.log("🎥 Starting video call...");
      const stream = await webrtcService.getUserMedia("video");
      console.log("✅ Got video stream");

      // Show local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // ALWAYS listen for offer
      socket.on("webrtc:offer", async ({ signal }) => {
        console.log("📩 Video offer received");

        try {
          await webrtcService.answerPeer(
            stream,
            signal,
            (answerSignal) => {
              console.log("📤 Sending video answer");
              socket.emit("webrtc:answer", {
                callId,
                signal: answerSignal,
              });
            },
            (remoteStream) => {
              console.log("📹 Remote video stream received");
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch(() => {});
              }
              dispatch(setCallStatus("connected"));
              setConnecting(false);
            },
            (error) => {
              console.error("❌ Video WebRTC error:", error);
              endCall();
            },
          );
        } catch (error) {
          console.error("❌ Failed to create video answer:", error);
          endCall();
        }
      });

      // ALWAYS listen for answer
      socket.on("webrtc:answer", ({ signal }) => {
        console.log("📩 Video answer received (caller)");

        setTimeout(() => {
          webrtcService.acceptSignal(signal);
        }, 0);

        dispatch(setCallStatus("connected"));
        setConnecting(false);
      });

      // IF THIS USER STARTED THE CALL → create offer
      if (status === "calling") {
        console.log("📞 Creating video offer (caller)");

        webrtcService.createPeer(
          stream,
          (signal) => {
            console.log("📡 Video offer generated");
            socket.emit("webrtc:offer", {
              callId,
              receiverId,
              signal,
            });
          },
          (remoteStream) => {
            console.log("📹 Remote video stream received (caller)");

            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(() => {});
            }

            dispatch(setCallStatus("connected"));
            setConnecting(false);
          },
          (error) => {
            console.error("Video WebRTC error:", error);
            endCall();
          },
        );
      }
    } catch (error) {
      console.error("Failed to start video call:", error);
      alert("Could not access camera/microphone");
      navigate(-1);
    }
  };

  useEffect(() => {
    initCall();

    return () => {
      cleanup();
    };
  }, []);

  const handleToggleMute = () => {
    dispatch(toggleMute());
    webrtcService.toggleAudio(!isMuted);
  };

  const handleToggleVideo = () => {
    dispatch(toggleVideo());
    webrtcService.toggleVideo(isVideoOff); // Note: opposite logic
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* If no remote stream yet, show placeholder */}
        {!callStatus || callStatus !== "connected" ? (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              {otherUser?.profile_img ? (
                <img
                  src={`${API_BASE_URL}${otherUser.profile_img}`}
                  alt={otherUser.name}
                  className="h-32 w-32 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                  {otherUser?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <p className="text-white text-xl">
                {connecting ? "Calling..." : "Connecting..."}
              </p>
            </div>
          </div>
        ) : null}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/50 to-transparent">
          <div>
            <h2 className="font-semibold text-lg">
              {otherUser?.name || "Unknown"}
            </h2>
            <p className="text-sm opacity-80">{formatDuration(duration)}</p>
          </div>
          <button
            onClick={endCall}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Local Video (Small preview) */}
        <div className="absolute bottom-24 right-4 w-32 h-44 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
          {isVideoOff ? (
            <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900/95 p-6 pb-8 backdrop-blur-sm">
        <div className="flex justify-center gap-4">
          {/* Mute Button */}
          <button
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={handleToggleMute}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          {/* Camera Button */}
          <button
            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={handleToggleVideo}
          >
            {isVideoOff ? (
              <VideoOff className="h-6 w-6" />
            ) : (
              <Video className="h-6 w-6" />
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* CSS for mirror effect on local video */}
      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default VideoCall;
