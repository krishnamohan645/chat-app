import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  changePasswordAPI,
  getAllUsersAPI,
  getMyProfileAPI,
  getUserProfileAPI,
  registerDeviceAPI,
  searchUsersAPI,
  updateProfileAPI,
} from "./userAPI";

export const registerDevice = createAsyncThunk(
  "user/registerDevice",
  async (data, { rejectWithValue }) => {
    try {
      const res = await registerDeviceAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getMyProfile = createAsyncThunk(
  "user/getMyProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      // 🛑 HARD GUARD (MOST IMPORTANT)
      if (!token) {
        return rejectWithValue("NO_TOKEN");
      }

      const res = await getMyProfileAPI();
      console.log(res.data, "res in getMyProfile redux");

      return res.data.user;
    } catch (err) {
      console.log(err.response?.data?.message, "error in getMyProfile redux");
      return rejectWithValue(err.response?.data?.message || "PROFILE_FAILED");
    }
  },
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      const res = await updateProfileAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await changePasswordAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const searchUsers = createAsyncThunk(
  "user/searchUsers",
  async (data, { rejectWithValue }) => {
    try {
      const res = await searchUsersAPI(data);
      console.log(res.data, "ressss in search users");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAllUsersAPI();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getUserProfile = createAsyncThunk(
  "user/getUserProfile",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await getUserProfileAPI(userId);
      console.log(res.data, "ressss in getUserProfile");
      return res.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    user: null,
    loading: false,
    error: null,
    searchUsers: [],
    selectedUser: null,
  },
  reducers: {
    clearSearch: (state) => {
      state.searchUsers = [];
    },
  },
  extraReducers: (builder) => {
    // GET MY PROFILE
    builder
      .addCase(getMyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // UPDATE PROFILE
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // CHANGE PASSWORD
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // GET ALL USERS
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || [];
      })
      .addCase(getAllUsers.rejected, (state) => {
        state.loading = false;
      });

    // SEARCH USERS
    builder
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchUsers = action.payload?.users || action.payload || [];
      })

      .addCase(searchUsers.rejected, (state) => {
        state.loading = false;
      });

    // GET USER PROFILE
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(getUserProfile.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { clearSearch } = userSlice.actions;
export default userSlice.reducer;
