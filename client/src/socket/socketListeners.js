import store from "../app/store";
import {
  incrementUnread,
  updateLastMessage,
  setTypingUser,
  removeTypingUser,
} from "../features/chats/chatSlice";
import {
  addMessage,
  deleteMessageForEveryoneLocal,
  editMessage,
  markDelivered,
  markRead,
} from "../features/messages/messagesSlice";
import { getSocket } from "./socket";

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
    dispatch(
      updateLastMessage({
        chatId: payload.chatId,
        message: payload.lastMessage,
      }),
    );
    dispatch(incrementUnread(payload));
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

  // ✅ TYPING START - with detailed logging
  socket.on("typing:start", ({ chatId, userId }) => {
    console.log("🎯🎯🎯 typing:start LISTENER FIRED!", { chatId, userId });
    console.log("Socket ID that received:", socket.id);

    const myUserId = store.getState().user.user.id;
    console.log("My user ID:", myUserId, "Typer ID:", userId);

    // Don't show typing indicator for myself
    if (userId === myUserId) {
      console.log("⛔ Ignoring - I'm the one typing");
      return;
    }

    console.log("✅ Dispatching setTypingUser to Redux");
    dispatch(setTypingUser({ chatId: Number(chatId), userId }));

    // Verify Redux updated
    setTimeout(() => {
      const typingState = store.getState().chats.typingUsers;
      console.log("📊 Redux typingUsers state:", typingState);
    }, 50);
  });

  // ✅ TYPING STOP
  socket.on("typing:stop", ({ chatId, userId }) => {
    console.log("🎯 typing:stop LISTENER FIRED!", { chatId, userId });
    dispatch(removeTypingUser({ chatId: Number(chatId), userId }));
  });

  console.log("✅ All socket listeners registered successfully");

  // ✅ Verify listeners are attached
  const events = Object.keys(socket._callbacks || {}).map((e) =>
    e.replace("$", ""),
  );
  console.log("📋 Registered socket events:", events);
};

export const resetSocketListeners = () => {
  console.log("🔄 Resetting socket listeners flag");
  listenersRegistered = false;
};
