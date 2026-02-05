import authReducer from "../features/auth/authSlice";
import userReducer from "../features/user/userSlice";
import settingsReducer from "../features/settings/settingsSlice";
import chatReducer from "../features/chats/chatSlice";

export default {
  auth: authReducer,
  user: userReducer,
  settings: settingsReducer,
  chats: chatReducer,
};
