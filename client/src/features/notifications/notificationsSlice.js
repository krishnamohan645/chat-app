import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getNotificationsAPI,
  getUnreadCountAPI,
  markAllAsReadAPI,
  markAsReadAPI,
} from "./notificationsAPI";

export const getNotificationsThunk = createAsyncThunk(
  "notifications/get",
  async ({ page = 1 }, { rejectWithValue }) => {
    try {
      const res = await getNotificationsAPI(page);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const markAsReadThunk = createAsyncThunk(
  "notifications/markAsRead",
  async (id, { rejectWithValue }) => {
    try {
      await markAsReadAPI(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const markAllAsReadThunk = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await markAllAsReadAPI();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getUnreadCountThunk = createAsyncThunk(
  "notifications/getUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUnreadCountAPI();
      return res.data.unreadCount;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    addNotificationRealtime: (state, action) => {
      const exists = state.notifications.find(
        (n) => n.id === action.payload.id,
      );

      if (!exists) {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      }
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // GET NOTIFICATIONS
      .addCase(getNotificationsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.notifications = action.payload.notifications;
        } else {
          state.notifications.push(...action.payload.notifications);
        }

        state.unreadCount = action.payload.unreadCount;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    //   MARK AS READ
    builder
      .addCase(markAsReadThunk.fulfilled, (state, action) => {
        const idx = state.notifications.find((n) => n.id === action.payload);
        if (idx && !idx.isRead) {
          idx.isRead = true;
          state.unreadCount -= 1;
        }
      })
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotificationRealtime, decrementUnreadCount} = notificationsSlice.actions;
export default notificationsSlice.reducer;
