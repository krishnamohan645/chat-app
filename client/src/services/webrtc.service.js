import SimplePeer from "simple-peer";

// ═══════════════════════════════════════════════════════════════════════════
// WebRTC Service
// ═══════════════════════════════════════════════════════════════════════════

class WebRTCService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  async getDesktopCameraId() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === "videoinput");

    console.log(
      "Available cameras:",
      cameras.map((c) => c.label),
    );

    // 🚫 Exclude virtual/mobile cameras
    const desktopCamera = cameras.find((c) => {
      const label = c.label.toLowerCase();

      return (
        !label.includes("virtual") &&
        !label.includes("droidcam") &&
        !label.includes("iriun") &&
        !label.includes("epoccam") &&
        !label.includes("android") &&
        !label.includes("iphone")
      );
    });

    console.log("Selected desktop camera:", desktopCamera?.label);

    return desktopCamera?.deviceId || cameras[0]?.deviceId;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Get User Media (Camera/Mic)
  // ─────────────────────────────────────────────────────────────────────────
  async getUserMedia(type = "audio") {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          type === "video"
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                aspectRatio: { ideal: 16 / 9 },
                deviceId: {
                  exact: await this.getDesktopCameraId(), // ✅ FORCE selected cam
                },
              }
            : false,
      };

      console.log("📹 Requesting media with constraints:", constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // ✅ Log which camera was selected
      if (type === "video") {
        const videoTrack = this.localStream.getVideoTracks()[0];
        console.log("✅ Using video device:", videoTrack.label);
        console.log("📹 Video settings:", videoTrack.getSettings());
      }

      return this.localStream;
    } catch (error) {
      console.error("Error getting user media:", error);
      throw new Error("Could not access camera/microphone");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Create Peer (Caller - initiator)
  // ─────────────────────────────────────────────────────────────────────────
  createPeer(stream, onSignal, onStream, onError) {
    this.peer = new SimplePeer({
      initiator: true, // or false in answerPeer
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    this.peer.on("signal", (signal) => {
      console.log("📡 Peer signal generated:", signal);
      onSignal(signal);
    });

    this.peer.on("stream", (remoteStream) => {
      console.log("📹 Remote stream received");
      console.log("Remote tracks:", remoteStream.getTracks());
      this.remoteStream = remoteStream;
      onStream(remoteStream);
    });

    this.peer.on("error", (err) => {
      console.error("❌ Peer error:", err);
      onError(err);
    });

    this.peer.on("close", () => {
      console.log("🔌 Peer connection closed");
    });

    return this.peer;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Answer Peer (Receiver - not initiator)
  // ─────────────────────────────────────────────────────────────────────────
  answerPeer(stream, callerSignal, onSignal, onStream, onError) {
    console.log("🎯 answerPeer called with:", {
      hasStream: !!stream,
      callerSignal,
      hasOnSignal: typeof onSignal === "function",
    });

    return new Promise((resolve, reject) => {
      try {
        console.log("🔨 Creating SimplePeer with initiator: false");

        this.peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });

        console.log("✅ SimplePeer instance created:", this.peer);

        this.peer.on("signal", (signal) => {
          console.log("🎉🎉🎉 SIGNAL EVENT FIRED! Answer generated:", signal);
          console.log("Signal type:", signal.type);
          console.log("Calling onSignal callback...");

          try {
            onSignal(signal);
            console.log("✅ onSignal callback executed successfully");
          } catch (err) {
            console.error("❌ Error in onSignal callback:", err);
          }
        });

        this.peer.on("stream", (remoteStream) => {
          console.log("📹 Remote stream received (answerer)");
          this.remoteStream = remoteStream;
          onStream(remoteStream);
        });

        this.peer.on("error", (err) => {
          console.error("❌ Peer error:", err);
          onError(err);
          reject(err);
        });

        this.peer.on("close", () => {
          console.log("🔌 Peer connection closed");
        });

        // ✅ Process the offer after a small delay
        console.log("⏳ Waiting 200ms before processing offer...");
        setTimeout(() => {
          console.log("📥 NOW processing caller's offer...");
          console.log("Offer signal:", callerSignal);

          try {
            this.peer.signal(callerSignal);
            console.log("✅ peer.signal() called successfully");
            resolve(this.peer);
          } catch (err) {
            console.error("❌ Error calling peer.signal():", err);
            reject(err);
          }
        }, 200); // Increased to 200ms
      } catch (err) {
        console.error("❌ Error in answerPeer:", err);
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Accept Signal (Connect peers)
  // ─────────────────────────────────────────────────────────────────────────
  acceptSignal(signal) {
    if (this.peer) {
      this.peer.signal(signal);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mute/Unmute Audio
  // ─────────────────────────────────────────────────────────────────────────
  toggleAudio(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Enable/Disable Video
  // ─────────────────────────────────────────────────────────────────────────
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stop All Tracks
  // ─────────────────────────────────────────────────────────────────────────
  stopTracks() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Destroy Peer Connection
  // ─────────────────────────────────────────────────────────────────────────
  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.stopTracks();
  }
}

export default new WebRTCService();
