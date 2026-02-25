import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCallHistoryAPI,
  getMissedCallsAPI,
  getMissedCallsCountAPI,
  getCallStatsAPI,
  deleteCallAPI,
  clearCallHistoryAPI,
} from "./callsAPI";

// ═══════════════════════════════════════════════════════════════════════════
// THUNKS
// ═══════════════════════════════════════════════════════════════════════════

export const getCallHistoryThunk = createAsyncThunk(
  "calls/getHistory",
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue }) => {
    try {
      const res = await getCallHistoryAPI(page, limit, filters);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getMissedCallsThunk = createAsyncThunk(
  "calls/getMissed",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const res = await getMissedCallsAPI(page, limit);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getMissedCallsCountThunk = createAsyncThunk(
  "calls/getMissedCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMissedCallsCountAPI();
      return res.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const getCallStatsThunk = createAsyncThunk(
  "calls/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCallStatsAPI();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const deleteCallThunk = createAsyncThunk(
  "calls/delete",
  async (callId, { rejectWithValue }) => {
    try {
      await deleteCallAPI(callId);
      return callId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const clearCallHistoryThunk = createAsyncThunk(
  "calls/clearHistory",
  async (type = "all", { rejectWithValue }) => {
    try {
      await clearCallHistoryAPI(type);
      return type;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

// ═══════════════════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════════════════

const callsSlice = createSlice({
  name: "calls",
  initialState: {
    // Call history
    history: [],
    missedCalls: [],
    currentPage: 1,
    totalPages: 1,
    total: 0,
    missedCount: 0,

    // Statistics
    stats: null,

    // Current call state
    currentCall: null,
    callStatus: null, // 'calling', 'ringing', 'connected', 'ended'
    localStream: null,
    remoteStream: null,

    // Incoming call
    incomingCall: null,

    // UI states
    isMuted: false,
    isVideoOff: false,
    loading: false,
    error: null,
  },

  reducers: {
    // ─────────────────────────────────────────────────────────────────────
    // CURRENT CALL MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────
    setCurrentCall: (state, action) => {
      state.currentCall = action.payload;
    },

    setCallStatus: (state, action) => {
      state.callStatus = action.payload;
    },

    setLocalStream: (state, action) => {
      state.localStream = action.payload;
    },

    setRemoteStream: (state, action) => {
      state.remoteStream = action.payload;
    },

    clearCurrentCall: (state) => {
      state.currentCall = null;
      state.callStatus = null;
      state.localStream = null;
      state.remoteStream = null;
      state.isMuted = false;
      state.isVideoOff = false;
    },

    // ─────────────────────────────────────────────────────────────────────
    // INCOMING CALL
    // ─────────────────────────────────────────────────────────────────────
    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload;
    },

    clearIncomingCall: (state) => {
      state.incomingCall = null;
    },

    // ─────────────────────────────────────────────────────────────────────
    // CALL CONTROLS
    // ─────────────────────────────────────────────────────────────────────
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },

    toggleVideo: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },

    setMuted: (state, action) => {
      state.isMuted = action.payload;
    },

    setVideoOff: (state, action) => {
      state.isVideoOff = action.payload;
    },

    // ─────────────────────────────────────────────────────────────────────
    // MISSED CALLS COUNT
    // ─────────────────────────────────────────────────────────────────────
    incrementMissedCount: (state) => {
      state.missedCount += 1;
    },
  },

  extraReducers: (builder) => {
    builder
      // ─────────────────────────────────────────────────────────────────
      // GET CALL HISTORY
      // ─────────────────────────────────────────────────────────────────
      .addCase(getCallHistoryThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCallHistoryThunk.fulfilled, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.history = action.payload.calls;
        } else {
          state.history = [...state.history, ...action.payload.calls];
        }
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(getCallHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ─────────────────────────────────────────────────────────────────
      // GET MISSED CALLS
      // ─────────────────────────────────────────────────────────────────
      .addCase(getMissedCallsThunk.fulfilled, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.missedCalls = action.payload.calls;
        } else {
          state.missedCalls = [...state.missedCalls, ...action.payload.calls];
        }
        state.loading = false;
      })

      // ─────────────────────────────────────────────────────────────────
      // GET MISSED CALLS COUNT
      // ─────────────────────────────────────────────────────────────────
      .addCase(getMissedCallsCountThunk.fulfilled, (state, action) => {
        state.missedCount = action.payload;
      })

      // ─────────────────────────────────────────────────────────────────
      // GET STATS
      // ─────────────────────────────────────────────────────────────────
      .addCase(getCallStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // ─────────────────────────────────────────────────────────────────
      // DELETE CALL
      // ─────────────────────────────────────────────────────────────────
      .addCase(deleteCallThunk.fulfilled, (state, action) => {
        state.history = state.history.filter((c) => c.id !== action.payload);
        state.missedCalls = state.missedCalls.filter(
          (c) => c.id !== action.payload,
        );
      })

      // ─────────────────────────────────────────────────────────────────
      // CLEAR HISTORY
      // ─────────────────────────────────────────────────────────────────
      .addCase(clearCallHistoryThunk.fulfilled, (state, action) => {
        if (action.payload === "all") {
          state.history = [];
          state.missedCalls = [];
          state.missedCount = 0;
        } else if (action.payload === "missed") {
          state.missedCalls = [];
          state.missedCount = 0;
        }
      });
  },
});

export const {
  setCurrentCall,
  setCallStatus,
  setLocalStream,
  setRemoteStream,
  clearCurrentCall,
  setIncomingCall,
  clearIncomingCall,
  toggleMute,
  toggleVideo,
  setMuted,
  setVideoOff,
  incrementMissedCount,
} = callsSlice.actions;

export default callsSlice.reducer;
