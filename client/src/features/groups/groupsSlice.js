import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addGroupMembersAPI,
  createGroupAPI,
  getAllGroupMembersAPI,
  getGroupMembersAPI,
  getGroupsAPI,
  leaveGroupAPI,
  removeGroupMemberAPI,
} from "./groupsAPI";

export const getGroupsThunk = createAsyncThunk(
  "groups/getGroups",
  async (data, { rejectWithValue }) => {
    try {
      const res = await getGroupsAPI(data);
      return res.data.chats.filter((chat) => chat.type === "group");
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const createGroupThunk = createAsyncThunk(
  "groups/createGroup",
  async (data, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("members", JSON.stringify(data.members));
      if (data.groupImage) formData.append("groupImage", data.groupImage);
      const res = await createGroupAPI(formData);
      return res.data.chat;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const getGroupMembersThunk = createAsyncThunk(
  "groups/getGroupMembers",
  async (chatId, { rejectWithValue }) => {
    try {
      const res = await getGroupMembersAPI(chatId);
      return res.data.members;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

// ✅ Fetches ALL members including those who left — used for name resolution on old messages
export const getAllGroupMembersThunk = createAsyncThunk(
  "groups/getAllGroupMembers",
  async (chatId, { rejectWithValue }) => {
    try {
      const res = await getAllGroupMembersAPI(chatId);
      return res.data.members;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const addGroupMembersThunk = createAsyncThunk(
  "groups/addGroupMembers",
  async ({ chatId, members }, { rejectWithValue }) => {
    try {
      await addGroupMembersAPI(chatId, members);
      return members;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const removeGroupMemberThunk = createAsyncThunk(
  "groups/removeGroupMember",
  async ({ chatId, userId }, { rejectWithValue }) => {
    try {
      await removeGroupMemberAPI(chatId, userId);
      return userId;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const leaveGroupThunk = createAsyncThunk(
  "groups/leaveGroup",
  async (chatId, { rejectWithValue }) => {
    try {
      await leaveGroupAPI(chatId);
      return chatId;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

const groupSlice = createSlice({
  name: "groups",
  initialState: {
    groups: [],
    currentGroup: null,
    members: [], // active members only — for modal & admin checks
    allMembers: [], // ✅ active + past/left — for message sender name resolution
    loading: false,
    error: null,
  },
  reducers: {
    clearGroupState: (state) => {
      state.currentGroup = null;
      state.members = [];
      state.allMembers = [];
    },
    updateGroupLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chatIdNum = Number(chatId);
      const group = state.groups.find((g) => g.chatId === chatIdNum);
      if (!group) return;
      group.lastMessage = message;
      group.lastMessageAt = message.createdAt;
      state.groups = [
        group,
        ...state.groups.filter((g) => g.chatId !== chatIdNum),
      ];
    },
    incrementGroupUnread: (state, action) => {
      const { chatId, senderId, myUserId, openedChatId } = action.payload;
      const chatIdNum = Number(chatId);
      const group = state.groups.find((g) => g.chatId === chatIdNum);
      if (!group) return;
      if (senderId === myUserId) return;
      if (openedChatId === chatIdNum) return;
      group.unreadCount = (group.unreadCount || 0) + 1;
    },
    // ✅ Real-time member count update from socket event
    updateGroupMemberCount: (state, action) => {
      const { chatId, memberCount } = action.payload;

      state.groups = state.groups.map((g) =>
        Number(g.chatId) === Number(chatId) ? { ...g, memberCount } : g,
      );
    },

    resetGroupUnread: (state, action) => {
      const group = state.groups.find((g) => g.chatId === action.payload);
      if (group) group.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGroupsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload.map((g) => ({
          ...g,
          chatId: g.chatId ?? g.id,
        }));
      })
      .addCase(getGroupsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createGroupThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGroupThunk.fulfilled, (state, action) => {
        state.loading = false;

        const newGroup = {
          ...action.payload,
          chatId: action.payload.chatId ?? action.payload.id,
        };

        state.groups.unshift(newGroup);
      })
      .addCase(createGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Active members only (for modal list & admin checks)
      .addCase(getGroupMembersThunk.fulfilled, (state, action) => {
        state.members = action.payload;
      })

      // ✅ All members including left (for resolving sender names)
      .addCase(getAllGroupMembersThunk.fulfilled, (state, action) => {
        state.allMembers = action.payload;
      })

      .addCase(addGroupMembersThunk.fulfilled, () => {
        // member count updated via socket → updateGroupMemberCount reducer
      })

      .addCase(removeGroupMemberThunk.fulfilled, (state, action) => {
        state.members = state.members.filter(
          (m) => m.userId !== action.payload,
        );
      })

      .addCase(leaveGroupThunk.fulfilled, (state, action) => {
        const chatId = Number(action.payload);
        const group = state.groups.find((g) => g.chatId === chatId);
        if (group) {
          group.hasLeft = true;
          group.leftAt = new Date().toISOString();
        }
        state.currentGroup = null;
        state.members = [];
        state.allMembers = [];
      });
  },
});

export const {
  clearGroupState,
  updateGroupLastMessage,
  incrementGroupUnread,
  resetGroupUnread,
  updateGroupMemberCount,
} = groupSlice.actions;

export default groupSlice.reducer;
