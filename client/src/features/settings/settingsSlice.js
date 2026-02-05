import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getSettingsAPI, updateSettingsAPI } from "./settingsAPI";

export const getSettings = createAsyncThunk(
  "settings/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getSettingsAPI();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const updateSettings = createAsyncThunk(
  "settings/update",
  async (data, { rejectWithValue }) => {
    try {
      const res = await updateSettingsAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export default settingsSlice.reducer;
