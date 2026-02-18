import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addGroupMembersAPI,
  createGroupAPI,
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
      console.log(
        res.data.chats.filter((chat) => chat.type === "group"),
        "groups in redux",
      );
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

      if (data.groupImage) {
        formData.append("groupImage", data.groupImage);
      }

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
      console.log(res.data.members, "members in redux");
      return res.data.members;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const addGroupMembersThunk = createAsyncThunk(
  "groups/addGroupMembers",
  async ({ chatId, members }, { rejectWithValue }) => {
    console.log(members, "add members in redux");
    console.log(chatId, "chatId in redux");
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
    members: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearGroupState: (state) => {
      state.currentGroup = null;
      state.members = [];
    },
    updateGroupLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chatIdNum = Number(chatId);

      const group = state.groups.find((g) => g.chatId === chatIdNum);
      if (!group) return;

      group.lastMessage = message;
      group.lastMessageAt = message.createdAt;

      // Move to top
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

    updateGroupMemberCount: (state, action) => {
      const { chatId, memberCount } = action.payload;
      const group = state.groups.find((g) => g.chatId === Number(chatId));
      if (group) group.memberCount = memberCount;
    },

    resetGroupUnread: (state, action) => {
      const group = state.groups.find((g) => g.chatId === action.payload);
      if (group) group.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    // FETCH GROUPS
    builder
      .addCase(getGroupsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(getGroupsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //   CREATE GROUP
      .addCase(createGroupThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createGroupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.unshift(action.payload);
      })
      .addCase(createGroupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ADD MEMBERS
      .addCase(addGroupMembersThunk.fulfilled, (state, action) => {
        // state.members = [...state.members, ...action.payload];
      })

      // GET MEMBERS
      .addCase(getGroupMembersThunk.fulfilled, (state, action) => {
        state.members = action.payload;
      })

      // REMOVE MEMBER
      .addCase(removeGroupMemberThunk.fulfilled, (state, action) => {
        state.members = state.members.filter(
          (member) => member.userId !== action.payload,
        );
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
