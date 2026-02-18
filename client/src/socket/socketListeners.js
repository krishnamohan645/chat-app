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
    console.log("👥 group:members-updated received:", { chatId, memberCount });
    dispatch(updateGroupMemberCount({ chatId: Number(chatId), memberCount }));
    dispatch(getGroupMembersThunk(chatId)); // re-fetch fresh member list
  });

  // ✅ GROUP SYSTEM MESSAGE (member added/removed/left)
  socket.on("receive-message", (msg) => {
    console.log("📩 receive-message (group system):", msg);
    if (msg.type === "system") {
      dispatch(addMessage(msg));
    }
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
