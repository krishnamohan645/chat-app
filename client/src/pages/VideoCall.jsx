import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  CameraIcon,
  X,
} from "lucide-react";

const VideoCall = () => {
  const [callState, setCallState] = useState("incoming");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (callState === "connected") {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const caller = {
    name: "Sarah Wilson",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  };

  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/20 to-white dark:from-blue-500/10 dark:to-gray-900 z-50 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4 flex items-center justify-center gap-2">
            <Video className="h-4 w-4" />
            Incoming Video Call
          </p>
          <div className="h-32 w-32 mx-auto mb-6 ring-4 ring-blue-500/30 rounded-full animate-pulse">
            <img
              src={caller.avatar}
              alt={caller.name}
              className="h-full w-full rounded-full object-cover"
            />
            <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl">
              {caller.name.charAt(0)}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {caller.name}
          </h2>
        </div>

        <div className="flex gap-8">
          <Link to="/chats">
            <button className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center">
              <PhoneOff className="h-7 w-7" />
            </button>
          </Link>
          <button
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
            onClick={() => setCallState("connected")}
          >
            <Video className="h-7 w-7" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Remote Video (Placeholder) */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900 flex items-center justify-center">
          {isVideoOn ? (
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop"
              alt={caller.name}
              className="h-full w-full object-cover opacity-80"
            />
          ) : (
            <div className="h-32 w-32 rounded-full overflow-hidden">
              <img
                src={caller.avatar}
                alt={caller.name}
                className="h-full w-full object-cover"
              />
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl">
                {caller.name.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white">
          <div>
            <h2 className="font-semibold">{caller.name}</h2>
            <p className="text-sm opacity-80">{formatDuration(duration)}</p>
          </div>
          <Link to="/chats">
            <button className="p-2 text-white hover:bg-white/20 rounded-full">
              <X className="h-6 w-6" />
            </button>
          </Link>
        </div>

        {/* Local Video (Small preview) */}
        <div className="absolute bottom-24 right-4 w-32 h-44 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
          {isVideoOn ? (
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <CameraIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          ) : (
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900/95 p-6 pb-8">
        <div className="flex justify-center gap-4">
          <button
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              isMuted
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
          <button
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              !isVideoOn
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </button>
          <Link to="/chats">
            <button className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
              <PhoneOff className="h-6 w-6" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
