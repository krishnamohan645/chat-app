import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const AudioCall = () => {
  // const { type } = useParams();
  const [callState, setCallState] = useState("incoming");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
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
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Incoming Audio Call
          </p>
          <div className="h-32 w-32 mx-auto mb-6 ring-4 ring-blue-500/30 rounded-full animate-pulse">
            <img
              src={caller.avatar}
              alt={caller.name}
              className="h-full w-full rounded-full object-cover"
            />
            <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl mt-[-8rem] hidden">
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
            <Phone className="h-7 w-7" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-500/10 to-white dark:from-blue-500/5 dark:to-gray-900 z-50 flex flex-col items-center justify-between p-8 py-16">
      <Link to="/chats" className="self-end">
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2">
          <X className="h-6 w-6" />
        </button>
      </Link>

      <div className="text-center">
        <div className="h-32 w-32 mx-auto mb-6 rounded-full">
          <img
            src={caller.avatar}
            alt={caller.name}
            className="h-full w-full rounded-full object-cover"
          />
          <div className="h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl mt-[-8rem] hidden">
            {caller.name.charAt(0)}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {caller.name}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {callState === "connected" ? formatDuration(duration) : "Call ended"}
        </p>
      </div>

      <div className="flex gap-4">
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
        <Link to="/chats">
          <button className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
            <PhoneOff className="h-6 w-6" />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AudioCall;
