import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createPrivateChatAPI, getChatListAPI, getMyChatsAPI } from "./chatAPI";

export const createPrivateChat = createAsyncThunk(
  "chat/createPrivateChat",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await createPrivateChatAPI(userId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const getMyChats = createAsyncThunk(
  "chat/getMyChats",
  async (limit, { rejectWithValue }) => {
    try {
      const res = await getMyChatsAPI(limit);
      return res.data.chats;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const getChatList = createAsyncThunk(
  "chat/getChatList",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getChatListAPI();
      return res.data.chats;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

const chatSlice = createSlice({
  name: "chats",
  initialState: {
    activeChat: null,
    chats: [],
    loading: false,
    error: null,
    myUserId: null,
  },
  reducers: {
    clearChat: (state) => {
      state.activeChat = null;
      state.messages = [];
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    setMyUserId: (state, action) => {
      state.myUserId = action.payload;
    },
    updateLastMessage: (state, action) => {
      const { chatId, message } = action.payload;

      const chat = state.chats.find((c) => c.chatId === chatId);
      if (!chat) return;

      chat.lastMessage = message;
      chat.lastMessageAt = message.createdAt;

      // move chat to top
      state.chats = [chat, ...state.chats.filter((c) => c.chatId !== chatId)];
    },

    incrementUnread: (state, action) => {
      const { chatId, senderId } = action.payload;

      const chat = state.chats.find((c) => c.chatId === chatId);
      if (!chatId) return;

      // dont increment for my own message,
      if (senderId === state.myUserId) return;

      if (state.activeChat?.chatId === chatId) return;

      chat.unreadCount = (chat.unreadCount || 0) + 1;
    },

    resetUnread: (state, action) => {
      const chat = state.chats.find((c) => c.chatId === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
  },
  extraReducers: (builder) => {
    // CREATE CHAT
    builder
      .addCase(createPrivateChat.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPrivateChat.fulfilled, (state, action) => {
        state.loading = false;
        state.activeChat = action.payload.chat;
      })
      .addCase(createPrivateChat.rejected, (state) => {
        state.loading = false;
      });

    //   GET MY CHATS
    builder
      .addCase(getMyChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(getMyChats.rejected, (state) => {
        state.loading = false;
      });

    // GET CHAT LISTS
    builder
      .addCase(getChatList.pending, (state) => {
        state.loading = true;
      })
      .addCase(getChatList.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(getChatList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearChat,
  setActiveChat,
  setMyUserId,
  updateLastMessage,
  incrementUnread,
  resetUnread,
} = chatSlice.actions;
export default chatSlice.reducer;
