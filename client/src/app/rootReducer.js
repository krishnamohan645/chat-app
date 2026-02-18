import authReducer from "../features/auth/authSlice";
import userReducer from "../features/user/userSlice";
import settingsReducer from "../features/settings/settingsSlice";
import chatReducer from "../features/chats/chatSlice";
import { setStoreReference } from "../services/axiosInstance";
import messageReducer from "../features/messages/messagesSlice";
import groupReducer from "../features/groups/groupsSlice";

const rootReducer = {
  auth: authReducer,
  user: userReducer,
  settings: settingsReducer,
  chats: chatReducer,
  messages: messageReducer,
  group: groupReducer,
};

setStoreReference(rootReducer);

export default rootReducer;
