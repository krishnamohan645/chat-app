import store from "../app/store";
import {
  incrementUnread,
  updateLastMessage,
  setTypingUser,
  removeTypingUser,
  setActiveChat, // ✅ Add this import
} from "../features/chats/chatSlice";
import {
  addMessage,
  deleteMessageForEveryoneLocal,
  editMessage,
  markDelivered,
  markRead,
} from "../features/messages/messagesSlice";
import {
  updateGroupLastMessage,
  incrementGroupUnread,
  updateGroupMemberCount,
  getGroupMembersThunk,
} from "../features/groups/groupsSlice";
import { getSocket } from "./socket";
import { addNotificationRealtime } from "../features/notifications/notificationsSlice";
import {
  clearCurrentCall,
  clearIncomingCall,
  incrementMissedCount,
  setCurrentCall,
  setIncomingCall,
} from "../features/calls/callsSlice";
import webrtcService from "../services/webrtc.service";
import.meta.env.VITE_API_URL;

let listenersRegistered = false;

export const registerSocketListeners = (dispatch) => {
  if (listenersRegistered) {
    console.log("⚠️ Socket listeners already registered, skipping");
    return;
  }

  const socket = getSocket();
  if (!socket) {
    console.error("❌ Socket not available for listener registration");
    return;
  }

  if (!socket.connected) {
    console.warn("⚠️ Socket not connected yet, listeners may not work");
  }

  listenersRegistered = true;
  console.log("✅ Registering socket listeners on socket ID:", socket.id);

  // CHAT LIST
  socket.on("chat-list:update", (payload) => {
    console.log("📨 chat-list:update received:", payload);

    const state = store.getState();
    const myUserId = state.auth.user?.id;

    dispatch(
      updateLastMessage({
        chatId: payload.chatId,
        message: payload.lastMessage,
      }),
    );
    dispatch(incrementUnread(payload));

    // ✅ If this is a group, also update group slice
    if (payload.type === "group") {
      dispatch(
        updateGroupLastMessage({
          chatId: payload.chatId,
          message: payload.lastMessage,
        }),
      );

      dispatch(
        incrementGroupUnread({
          chatId: payload.chatId,
          senderId: payload.lastMessage.senderId,
          myUserId,
          openedChatId: null, // we improve this later
        }),
      );
    }
  });

  // NEW MESSAGE
  socket.on("new-message", (msg) => {
    console.log("📩 new-message received:", msg);
    dispatch(addMessage(msg));
  });

  // MESSAGE DELIVERED
  socket.on("message-delivered", ({ chatId, messageId }) => {
    dispatch(markDelivered({ chatId, messageId }));
  });

  // MESSAGES READ
  socket.on("messages-read", ({ chatId, readerId }) => {
    console.log("messages-read received", chatId, readerId);
    const myUserId = store.getState().user.user.id;
    if (readerId !== myUserId) {
      dispatch(markRead({ chatId, myUserId }));
    }
  });

  // DELETE MESSAGE FOR EVERYONE
  socket.on("message-deleted-everyone", ({ chatId, messageId }) => {
    console.log("message-deleted-everyone ", chatId, messageId);
    dispatch(deleteMessageForEveryoneLocal({ chatId, messageId }));
  });

  // EDIT MESSAGE
  socket.on("message-edited", ({ chatId, messageId, content }) => {
    console.log("message-edited ", chatId, messageId, content);
    dispatch(editMessage({ chatId, messageId, content }));
  });

  // TYPING START
  socket.on("typing:start", ({ chatId, userId }) => {
    console.log("🎯🎯🎯 typing:start LISTENER FIRED!", { chatId, userId });
    console.log("Socket ID that received:", socket.id);

    const myUserId = store.getState().user.user.id;
    console.log("My user ID:", myUserId, "Typer ID:", userId);

    if (userId === myUserId) {
      console.log("⛔ Ignoring - I'm the one typing");
      return;
    }

    console.log("✅ Dispatching setTypingUser to Redux");
    dispatch(setTypingUser({ chatId: Number(chatId), userId }));

    setTimeout(() => {
      const typingState = store.getState().chats.typingUsers;
      console.log("📊 Redux typingUsers state:", typingState);
    }, 50);
  });

  // TYPING STOP
  socket.on("typing:stop", ({ chatId, userId }) => {
    console.log("🎯 typing:stop LISTENER FIRED!", { chatId, userId });
    dispatch(removeTypingUser({ chatId: Number(chatId), userId }));
  });

  // ✅ BLOCK STATUS CHANGED (when I block/unblock someone)
  socket.on("block-status-changed", ({ blockedUserId, isBlocked }) => {
    console.log("🔒 block-status-changed received:", {
      blockedUserId,
      isBlocked,
    });

    const { activeChat } = store.getState().chats;

    // Update activeChat if it's the affected user
    if (activeChat && activeChat.otherUserId === blockedUserId) {
      console.log("✅ Updating activeChat block status");
      dispatch(
        setActiveChat({
          ...activeChat,
          isBlockedByMe: isBlocked,
        }),
      );
    }
  });

  // ✅ BLOCKED BY USER (when someone blocks me)
  socket.on("blocked-by-user", ({ blockerId }) => {
    console.log("🚫 blocked-by-user received:", { blockerId });

    const { activeChat } = store.getState().chats;

    // Update activeChat if it's the blocker
    if (activeChat && activeChat.otherUserId === blockerId) {
      console.log("✅ Someone blocked me - updating activeChat");
      dispatch(
        setActiveChat({
          ...activeChat,
          hasBlockedMe: true,
        }),
      );
    }
  });

  // ✅ UNBLOCKED BY USER (when someone unblocks me)
  socket.on("unblocked-by-user", ({ blockerId }) => {
    console.log("✅ unblocked-by-user received:", { blockerId });

    const { activeChat } = store.getState().chats;

    // Update activeChat if it's the unblocker
    if (activeChat && activeChat.otherUserId === blockerId) {
      console.log("✅ Someone unblocked me - updating activeChat");
      dispatch(
        setActiveChat({
          ...activeChat,
          hasBlockedMe: false,
        }),
      );
    }
  });

  console.log("✅ All socket listeners registered successfully");

  // ✅ GROUP MEMBERS UPDATED (add/remove/leave)
  socket.on("group:members-updated", ({ chatId, memberCount }) => {
    console.log("🔥 BEFORE UPDATE:", store.getState().group.groups);
    console.log("👥 group:members-updated received:", { chatId, memberCount });
    dispatch(updateGroupMemberCount({ chatId: Number(chatId), memberCount }));
    dispatch(getGroupMembersThunk(chatId)); // re-fetch fresh member list
    setTimeout(() => {
      console.log("🔥 AFTER UPDATE:", store.getState().group.groups);
    }, 100);
  });

  // ✅ GROUP SYSTEM MESSAGE (member added/removed/left)
  socket.on("receive-message", (msg) => {
    console.log("📩 receive-message (group system):", msg);
    if (msg.type === "system") {
      dispatch(addMessage(msg));
    }
  });

  socket.on("new-notification", (notification) => {
    console.log("🔔 new-notification received:", notification);

    // ✅ FIX: Changed addNotification to addNotificationRealtime
    dispatch(addNotificationRealtime(notification));

    // Show browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      const notif = new Notification(notification.title, {
        body: notification.body,
        icon: notification.sender?.profile_img
          ? `${import.meta.env.VITE_API_URL}${notification.sender.profile_img}`
          : "/logo.png",
        tag: `notification-${notification.id}`,
        requireInteraction: false,
        silent: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notif.close(), 5000);
    }
  });

  // ✅ INCOMING CALL
  socket.on("call:incoming", ({ callId, callerId, type }) => {
    console.log("📞 call:incoming received:", { callId, callerId, type });

    // Get caller info from users or fetch
    const state = store.getState();
    const chats = state.chats.chats;
    const chat = chats.find((c) => c.otherUserId === callerId);

    dispatch(
      setIncomingCall({
        callId,
        callerId,
        type,
        callerInfo: chat
          ? {
              username: chat.name,
              profile_img: chat.profile_img,
            }
          : null,
      }),
    );

    // Play ringtone (optional)
    const audio = new Audio("/sounds/ringtone.mp3");
    audio.loop = true;
    audio.play().catch((e) => console.log("Audio play failed:", e));

    // Store audio reference to stop later
    window.callRingtone = audio;
  });

  socket.on("call:started", ({ callId, receiverId, type }) => {
    console.log("📞 call:started (I'm the caller):", {
      callId,
      receiverId,
      type,
    });

    // Store callId in Redux if needed
    dispatch(setCurrentCall({ callId, receiverId, type, isCaller: true }));
  });

  // ✅ CALL ACCEPTED
  socket.on("call:accepted", ({ callId }) => {
    console.log("✅ call:accepted:", callId);

    // Stop ringing sound
    if (window.callRingtone) {
      window.callRingtone.pause();
      window.callRingtone = null;
    }

    // Handle in call component (it will use WebRTC)
  });

  // ✅ CALL REJECTED
  socket.on("call:rejected", ({ callId }) => {
    console.log("❌ call:rejected:", callId);

    // Stop ringing sound
    if (window.callRingtone) {
      window.callRingtone.pause();
      window.callRingtone = null;
    }

    dispatch(clearIncomingCall());
    dispatch(clearCurrentCall());

    alert("Call was rejected");
  });

  // ✅ CALL MISSED
  socket.on("call:missed", ({ callId }) => {
    console.log("📵 call:missed:", callId);

    dispatch(incrementMissedCount());
    dispatch(clearCurrentCall());

    alert("Call was not answered");
  });

  // ✅ CALL ENDED

  socket.on("call:ended", ({ callId }) => {
    console.log("📴 call:ended received:", callId);

    // ✅ Stop ringtone
    if (window.callRingtone) {
      window.callRingtone.pause();
      window.callRingtone = null;
    }

    // ✅ DESTROY WEBRTC
    webrtcService.destroy();

    // ✅ Clear redux
    dispatch(clearIncomingCall());
    dispatch(clearCurrentCall());

    // ✅ Force leave call screen
    window.location.href = "/chats";
    // or use navigate if accessible
  });
  // ✅ CALL UNAVAILABLE
  socket.on("call:unavailable", ({ reason }) => {
    console.log("⚠️ call:unavailable:", reason);

    const messages = {
      USER_OFFLINE: "User is offline",
      INVALID_TYPE: "Invalid call type",
    };

    alert(messages[reason] || "Cannot start call");
    dispatch(clearCurrentCall());
  });

  // Verify listeners are attached
  const events = Object.keys(socket._callbacks || {}).map((e) =>
    e.replace("$", ""),
  );
  console.log("📋 Registered socket events:", events);
};

export const resetSocketListeners = () => {
  console.log("🔄 Resetting socket listeners flag");
  listenersRegistered = false;
};
