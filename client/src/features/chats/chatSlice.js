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
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("NO_TOKEN");
    try {
      const res = await getChatListAPI();
      console.log(res.data.chats, "chats in redux chat list");
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
      const chatIdNum = Number(chatId);

      const chat = state.chats.find((c) => c.chatId === chatIdNum);
      if (!chat) return;

      chat.lastMessage = message;
      chat.lastMessageAt = message.createdAt;

      state.chats = [
        chat,
        ...state.chats.filter((c) => c.chatId !== chatIdNum),
      ];
      console.log(
        "UPDATE_LAST_MESSAGE",
        action.payload.chatId,
        state.chats.map((c) => c.chatId),
      );
    },

    incrementUnread: (state, action) => {
      const { chatId, senderId } = action.payload;
      const chatIdNum = Number(chatId);

      const chat = state.chats.find((c) => c.chatId === chatIdNum);
      if (!chat) return;

      if (senderId === state.myUserId) return;
      if (state.activeChat?.chatId === chatIdNum) return;

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
        state.error = null;
      })
      .addCase(getChatList.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload; // This will be the array from res.data.chats
        console.log("✅ Chats loaded:", state.chats.length);
      })
      .addCase(getChatList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("❌ Failed to load chats:", action.payload);
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
