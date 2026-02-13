import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  deleteMessageForEveryoneAPI,
  deleteMessageForMeAPI,
  editMessageAPI,
  getMessagesAPI,
  readMessagesAPI,
  searchMessagesAPI,
  sendFileMessageAPI,
  sendMessageAPI,
  sendStickerAPI,
} from "./messagesAPI";

/* =======================
   THUNKS
======================= */

export const getMessages = createAsyncThunk(
  "messages/getMessages",
  async ({ chatId, limit = 20, offset = 0 }, { rejectWithValue }) => {
    try {
      const res = await getMessagesAPI(chatId, limit, offset);
      console.log(res.data, "res in getMessages thunk");
      return { chatId: Number(chatId), messages: res.data, offset };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
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
  },
);

export const searchMessages = createAsyncThunk(
  "messages/searchMessages",
  async ({ chatId, query }, { rejectWithValue }) => {
    try {
      const res = await searchMessagesAPI(chatId, query);
      return { chatId: Number(chatId), messages: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const sendMessageThunk = createAsyncThunk(
  "messages/sendMessage",
  async ({ chatId, content }, { rejectWithValue }) => {
    try {
      const res = await sendMessageAPI(chatId, content);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const deleteMessageForEveryoneThunk = createAsyncThunk(
  "messages/deleteMessageForEveryone",
  async ({ chatId, messageId }, { rejectWithValue }) => {
    try {
      await deleteMessageForEveryoneAPI({ chatId, messageId });
      return { chatId, messageId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const deleteMessageForMeThunk = createAsyncThunk(
  "messages/deleteMessageForMe",
  async ({ chatId, messageId }, { rejectWithValue }) => {
    try {
      await deleteMessageForMeAPI({ chatId, messageId });
      return { chatId, messageId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const editMessageThunk = createAsyncThunk(
  "messages/editMessage",
  async ({ chatId, messageId, content }, { rejectWithValue }) => {
    console.log(chatId, messageId, content, "in editMessageThunk");
    try {
      await editMessageAPI({ chatId, messageId, content });
      return { chatId, messageId, content };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const sendFileMessageThunk = createAsyncThunk(
  "messages/sendFileMessage",
  async ({ chatId, files }, { rejectWithValue }) => {
    try {
      const res = await sendFileMessageAPI(chatId, files);
      console.log(res, "res in send file message thunk");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const sendStickerThunk = createAsyncThunk(
  "messages/sendSticker",
  async ({ chatId, stickerUrl }, { rejectWithValue }) => {
    try {
      const res = await sendStickerAPI(chatId, stickerUrl);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

/* =======================
   SLICE
======================= */

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    byChat: {}, // { [chatId]: Message[] }
    searchResults: {},
    loading: false,
    error: null,
    search: "",
  },

  reducers: {
    /* -------- NEW MESSAGE (socket) -------- */
    addMessage: (state, action) => {
      const msg = action.payload;
      const chatId = Number(msg.chatId);

      if (!state.byChat[chatId]) {
        state.byChat[chatId] = [];
      }

      const exists = state.byChat[chatId].some((m) => m.id === msg.id);
      if (exists) return;

      state.byChat[chatId].push({
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt,

        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        fileSize: msg.fileSize || null,
        mimeType: msg.mimeType || null,

        status: msg.status || "sent",
        isEdited: msg.isEdited || false,
      });
    },

    /* -------- DELIVERED -------- */
    markDelivered: (state, action) => {
      const { chatId, messageId } = action.payload;
      const msgs = state.byChat[chatId];
      if (!msgs) return;

      const m = msgs.find((x) => x.id === messageId);
      if (m && m.status === "sent") m.status = "delivered";
    },

    /* -------- READ -------- */
    markRead: (state, action) => {
      const { chatId, myUserId } = action.payload || {};
      if (!chatId || !myUserId) return;

      const msgs = state.byChat[chatId];
      if (!msgs) return;

      // Update ALL my sent messages to read (not just new ones)
      msgs.forEach((m) => {
        if (m.senderId === myUserId && m.status !== "read") {
          m.status = "read";
        }
      });
    },

    // ------------SEND MESSAGE (socket)------------
    // sendMessage: (state, action) => {
    //   const msg = action.payload;
    //   const chatId = Number(msg.chatId);

    //   if (!state.byChat[chatId]) {
    //     state.byChat[chatId] = [];
    //   }

    //   state.byChat[chatId].push({
    //     ...msg,
    //     status: "sent",
    //   });
    // },

    deleteMessageForEveryoneLocal: (state, action) => {
      const { chatId, messageId } = action.payload;

      const msgs = state.byChat[chatId];
      if (!msgs) return;

      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.content = "This message was deleted";
        msg.type = "system";
        // 🔥 VERY IMPORTANT
        msg.fileUrl = null;
        msg.fileName = null;
        msg.fileSize = null;
        msg.mimeType = null;
      }
    },

    deleteMessageForMeLocal: (state, action) => {
      const { chatId, messageId } = action.payload;

      const msgs = state.byChat[chatId];
      if (!msgs) return;

      // Remove from local state
      state.byChat[chatId] = msgs.filter((m) => m.id !== messageId);
    },

    editMessage: (state, action) => {
      const { chatId, messageId, content } = action.payload;
      const msgs = state.byChat[chatId];
      if (!msgs) return;

      const msg = msgs.find((m) => m.id === messageId);
      if (msg) {
        msg.content = content;
        msg.isEdited = true;
      }
    },

    clearMessages: (state, action) => {
      const chatId = Number(action.payload);
      delete state.byChat[chatId];
    },

    clearSearchResults: (state, action) => {
      const chatId = Number(action.payload);
      delete state.searchResults[chatId];
    },
  },

  extraReducers: (builder) => {
    builder
      /* -------- GET MESSAGES -------- */
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        const { chatId, messages, offset } = action.payload;

        const formattedMessages = messages.reverse().map((m) => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          content: m.content,
          type: m.type,
          createdAt: m.createdAt,

          fileUrl: m.fileUrl || null,
          fileName: m.fileName || null,
          fileSize: m.fileSize || null,
          mimeType: m.mimeType || null,

          status: m.status || "sent",
          isEdited: m.isEdited || false,
        }));

        // 🔥 FIRST LOAD (offset = 0)
        if (!offset || offset === 0) {
          state.byChat[chatId] = formattedMessages;
        }
        // 🔥 LOAD MORE (offset > 0)
        else {
          state.byChat[chatId] = [
            ...formattedMessages,
            ...(state.byChat[chatId] || []),
          ];
        }

        state.loading = false;
      })

      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    /* -------- READ CHAT (API) -------- */
    // .addCase(markMessagesAsRead.fulfilled, (state, action) => {
    //   const { chatId } = action.payload;
    //   const msgs = state.byChat[chatId];
    //   if (!msgs) return;

    //   msgs.forEach((m) => {
    //     m.status = "read";
    //   });
    // });

    /* -------- SEARCH MESSAGES -------- */
    builder
      .addCase(searchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;

        state.searchResults[chatId] = messages.reverse().map((m) => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          content: m.content,
          type: m.type,
          createdAt: m.createdAt,
          status: "read", // 🔑 normalize
        }));

        state.loading = false;
      })

      .addCase(searchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ------------SEND MESSAGE------------
    builder
      .addCase(sendMessageThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessageThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ------------DELETE MESSAGE FOR ME------------
    builder.addCase(deleteMessageForMeThunk.fulfilled, (state, action) => {
      const { chatId, messageId } = action.payload;
      const msgs = state.byChat[chatId];
      if (!msgs) return;

      // Remove from local state
      state.byChat[chatId] = msgs.filter((m) => m.id !== messageId);
    });

    // ------------DELETE MESSAGE FOR EVERYONE------------
    builder.addCase(
      deleteMessageForEveryoneThunk.fulfilled,
      (state, action) => {
        const { chatId, messageId } = action.payload;
        const msgs = state.byChat[chatId];
        if (!msgs) return;

        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.content = "This message was deleted";
          msg.type = "system";

          msg.fileUrl = null;
          msg.fileName = null;
          msg.fileSize = null;
          msg.mimeType = null;
        }
      },
    );

    // ------------EDIT MESSAGE------------
    builder
      .addCase(editMessageThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(editMessageThunk.fulfilled, (state, action) => {
        const { chatId, messageId, content } = action.payload;
        const msgs = state.byChat[chatId];
        if (!msgs) return;

        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.content = content;
          msg.isEdited = true;
        }
        state.loading = false;
      })
      .addCase(editMessageThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });

    //------------ SEND FILE MESSAGE ------------
    builder
      .addCase(sendFileMessageThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendFileMessageThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendFileMessageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addMessage,
  markDelivered,
  markRead,
  clearMessages,
  clearSearchResults,
  // sendMessage,
  deleteMessageForEveryoneLocal,
  deleteMessageForMeLocal,
  editMessage,
} = messageSlice.actions;

export default messageSlice.reducer;
