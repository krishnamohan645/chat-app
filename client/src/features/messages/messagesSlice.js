import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMessagesAPI, readMessagesAPI } from "./messagesAPI";

/* =======================
   THUNKS
======================= */

export const getMessages = createAsyncThunk(
  "messages/getMessages",
  async ({ chatId, limit = 20, offset = 0 }, { rejectWithValue }) => {
    try {
      const res = await getMessagesAPI(chatId, limit, offset);
      return { chatId: Number(chatId), messages: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "messages/markAsRead",
  async (chatId, { rejectWithValue }) => {
    try {
      await readMessagesAPI(chatId);
      return { chatId: Number(chatId) };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* =======================
   SLICE
======================= */

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    byChat: {}, // { [chatId]: Message[] }
    loading: false,
    error: null,
  },

  reducers: {
    /* -------- NEW MESSAGE (socket) -------- */
    addMessage: (state, action) => {
      const msg = action.payload;
      const chatId = Number(msg.chatId);

      if (!state.byChat[chatId]) {
        state.byChat[chatId] = [];
      }

      state.byChat[chatId].push({
        ...msg,
        status: msg.status || "sent", // normalize
      });
    },

    /* -------- DELIVERED -------- */
    markDelivered: (state, action) => {
      const { chatId } = action.payload;
      const msgs = state.byChat[chatId];
      if (!msgs) return;

      msgs.forEach((m) => {
        if (m.status === "sent") {
          m.status = "delivered";
        }
      });
    },

    /* -------- READ -------- */
    markRead: (state, action) => {
      const { chatId } = action.payload;
      const msgs = state.byChat[chatId];
      if (!msgs) return;

      msgs.forEach((m) => {
        if (m.status !== "read") {
          m.status = "read";
        }
      });
    },

    clearMessages: (state, action) => {
      const chatId = Number(action.payload);
      delete state.byChat[chatId];
    },
  },

  extraReducers: (builder) => {
    builder
      /* -------- GET MESSAGES -------- */
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;

        state.byChat[chatId] = messages
          .reverse() // oldest → newest
          .map((m) => ({
            id: m.id,
            chatId: m.chatId,
            senderId: m.senderId,
            content: m.content,
            type: m.type,
            createdAt: m.createdAt,

            // 🔑 normalize status from MessageStatus
            status:
              m.MessageStatuses?.[0]?.status || "sent",
          }));

        state.loading = false;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* -------- READ CHAT (API) -------- */
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        const msgs = state.byChat[chatId];
        if (!msgs) return;

        msgs.forEach((m) => {
          m.status = "read";
        });
      });
  },
});

export const {
  addMessage,
  markDelivered,
  markRead,
  clearMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
