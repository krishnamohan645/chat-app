import {
  incrementUnread,
  updateLastMessage,
} from "../features/chats/chatSlice";
import { addMessage, markRead } from "../features/messages/messagesSlice";
import { getSocket } from "./socket";

let listenersRegistered = false;

export const registerSocketListeners = (dispatch) => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  const socket = getSocket();
  if (!socket) return;

  //   CHAT LIST
  socket.on("chat-list:update", (payload) => {
    dispatch(
      updateLastMessage({
        chatId: payload.chatId,
        message: payload.lastMessage,
      }),
    );
    dispatch(incrementUnread(payload));
  });

  // Messages
  socket.on("new-message", (msg) => {
    dispatch(addMessage(msg));
  });

  // Message Status Update
  socket.on("messages-read", ({ chatId }) => {
    dispatch(markRead({ chatId }));
  });
};


export const resetSocketListeners = () => {
  listenersRegistered = false;
};