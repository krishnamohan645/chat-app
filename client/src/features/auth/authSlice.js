import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  forgotPasswordAPI,
  loginAPI,
  logoutAPI,
  registerAPI,
  resendOtpAPI,
  resetPasswordAPI,
  verifyOtpAPI,
} from "./authAPI";
import api from "../../services/axiosInstance";

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
      console.log(res.data, "resend otp");
      return res.data;
    } catch (error) {
      console.log(error, "error");
      return rejectWithValue(error.response.data.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await loginAPI(data);
      localStorage.setItem("token", res.data.accessToken);
      console.log(res.data, "login response");
      return res.data;
    } catch (error) {
      console.error("error", error);
      return rejectWithValue(error.response.data.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await logoutAPI();
      localStorage.removeItem("token");
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  },
);

export const initAuth = createAsyncThunk(
  "auth/init",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/refresh");
      localStorage.setItem("token", res.data.accessToken);
      return res.data.accessToken;
    } catch {
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
    token: localStorage.getItem("token"),
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
      state.token = false;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
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

    //   VERIFY OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        // state.otpVerified = true;
        state.isAuthenticated = true;
        state.user = action.payload.user;

        // 👇 ADD THIS
        localStorage.setItem("token", action.payload.accessToken);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Invalid OTP";
        state.isAuthenticated = false;
      });

    //   RESEND OTP
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // LOGOUT
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
    });

    // REFRESH TOKEN (INITAUTH)
    builder
      .addCase(initAuth.pending, (state) => {
        state.authLoading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
        state.authLoading = false;
      })
      .addCase(initAuth.rejected, (state) => {
        state.authLoading = false;
        state.isAuthenticated = false;
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

export const { resetAuthState, logoutLocal } = authSlice.actions;
export default authSlice.reducer;
