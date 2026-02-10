// src/features/auth/authSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  forgotPasswordAPI,
  loginAPI,
  logoutAPI,
  refreshAPI,
  registerAPI,
  resendOtpAPI,
  resetPasswordAPI,
  verifyOtpAPI,
} from "./authAPI";
import { setAxiosToken } from "../../services/axiosInstance";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await registerAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      const res = await verifyOtpAPI(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message || "Invalid OTP");
    }
  },
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (data, { rejectWithValue }) => {
    try {
      const res = await resendOtpAPI(data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await loginAPI(data);
      return {
        token: res.data.accessToken,
        user: res.data.user,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await logoutAPI();
  return true;
});

export const initAuth = createAsyncThunk(
  "auth/init",
  async (_, { rejectWithValue }) => {
    try {
      const res = await refreshAPI();
      console.log("✅ Refresh API succeeded:", res.data);
      return res.data.accessToken;
    } catch (error) {
      console.log("❌ Refresh API failed:", error.response?.status);
      return rejectWithValue(null);
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await forgotPasswordAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data, { rejectWithValue }) => {
    try {
      const res = await resetPasswordAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    authLoading: true,
    isAuthenticated: false,
    success: false,
    otpSent: false,
    otpVerified: false,
    error: null,
    token: null,
    forgotPasswordLoading: false,
    resetPasswordLoading: false,
    passwordResetSuccess: false,
  },
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.success = false;
      state.otpSent = false;
      state.otpVerified = false;
      state.error = null;
    },
    logoutLocal: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("user");
      setAxiosToken(null);
    },
    // ✅ Used by axios interceptor for token refresh
    setAccessToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      setAxiosToken(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.otpSent = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // VERIFY OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;

        // ✅ Set axios token
        setAxiosToken(action.payload.accessToken);

        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        console.log("✅ OTP verified, token set");
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Invalid OTP";
        state.isAuthenticated = false;
      });

    // RESEND OTP
    builder
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;

        // ✅ Set axios token
        setAxiosToken(action.payload.token);
        console.log("✅ Login succeeded, token set");
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // LOGOUT
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.token = null;

      // ✅ Clear axios token
      setAxiosToken(null);
      localStorage.removeItem("user");
      console.log("✅ Logged out, token cleared");
    });

    // ✅ INIT AUTH (REFRESH TOKEN)
    builder
      .addCase(initAuth.pending, (state) => {
        state.authLoading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
        state.authLoading = false;

        // ✅ CRITICAL FIX - Set axios token immediately
        setAxiosToken(action.payload);
        console.log("✅ Auth initialized, token set in Axios");
      })
      .addCase(initAuth.rejected, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.authLoading = false;

        // ✅ Clear axios token
        setAxiosToken(null);
        console.log("❌ Auth initialization failed");
      });

    // FORGOT PASSWORD
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.forgotPasswordLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.error = action.payload;
      });

    // RESET PASSWORD
    builder
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.resetPasswordLoading = false;
        state.passwordResetSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.error = action.payload;
      });
  },
});

export const { reset, logoutLocal, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
