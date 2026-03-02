import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getSocket } from "../socket/socket";
import webrtcService from "../services/webrtc.service";
import {
  clearCurrentCall,
  toggleMute,
  setCallStatus,
} from "../features/calls/callsSlice";
import { API_BASE_URL } from "../config/constants";

const AudioCall = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const socket = getSocket();
  const [searchParams] = useSearchParams();

  const receiverId = searchParams.get("receiverId");
  const callId = searchParams.get("callId");
  const status = searchParams.get("status"); // 'calling' or 'connected'

  const { callStatus, isMuted } = useSelector((state) => state.calls);
  const chats = useSelector((state) => state.chats.chats);

  const [duration, setDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [connecting, setConnecting] = useState(status === "calling");

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
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
      const stream = await webrtcService.getUserMedia("audio");

      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      // ALWAYS listen for offer
      socket.on("webrtc:offer", async ({ signal }) => {
        try {
          console.log("🚀 Starting answerPeer...");

          await webrtcService.answerPeer(
            stream,
            signal,
            (answerSignal) => {
              socket.emit("webrtc:answer", {
                callId,
                signal: answerSignal,
              });
            },
            (remoteStream) => {
              console.log("📹 Remote stream received (receiver)");
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current.play().catch(() => {});
              }
              dispatch(setCallStatus("connected"));
              setConnecting(false);
            },
            (error) => {
              console.error("❌ WebRTC error:", error);
              endCall();
            },
          );
        } catch (error) {
          console.error("❌ Failed to create answer:", error);
          console.error("Error stack:", error.stack);
          endCall();
        }
      });

      // ALWAYS listen for answer
      socket.on("webrtc:answer", ({ signal }) => {
        setTimeout(() => {
          webrtcService.acceptSignal(signal);
        }, 0);

        dispatch(setCallStatus("connected"));
        setConnecting(false);
      });

      // IF THIS USER STARTED THE CALL → create offer
      if (status === "calling") {
        webrtcService.createPeer(
          stream,
          (signal) => {
            socket.emit("webrtc:offer", {
              callId,
              receiverId,
              signal,
            });
          },
          (remoteStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current.play().catch(() => {});
            }

            dispatch(setCallStatus("connected"));
            setConnecting(false);
          },
          (error) => {
            console.error("WebRTC error:", error);
            endCall();
          },
        );
      }
    } catch (error) {
      console.error("Failed to start call:", error);
      alert("Could not access microphone");
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

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500/10 to-white dark:from-blue-500/5 dark:to-gray-900 z-50 flex flex-col items-center justify-between p-8 py-16">
      {/* Hidden audio elements */}
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />

      <button onClick={endCall} className="self-end">
        <X className="h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
      </button>

      <div className="text-center">
        <div className="h-32 w-32 mx-auto mb-6 rounded-full">
          {otherUser?.profile_img ? (
            <img
              // src={`${API_BASE_URL}${otherUser.profile_img}`}
              src={otherUser.profile_img}
              alt={otherUser.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
              {otherUser?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {otherUser?.name || "Unknown"}
        </h2>

        <p className="text-gray-500 dark:text-gray-400">
          {connecting
            ? "Calling..."
            : callStatus === "connected"
              ? formatDuration(duration)
              : "Connecting..."}
        </p>
      </div>

      <div className="flex gap-4">
        <button
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? "bg-red-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          onClick={handleToggleMute}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>

        <button
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
            isSpeakerOn
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          {isSpeakerOn ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )}
        </button>

        <button
          onClick={endCall}
          className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default AudioCall;
