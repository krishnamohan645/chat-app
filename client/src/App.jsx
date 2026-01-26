import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatList from "./pages/ChatList";
import Chat from "./pages/Chat";
import GroupChat from "./pages/GroupChat";
import Groups from "./pages/Groups";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import UserSearch from "./pages/UserSearch";
import AudioCall from "./pages/AudioCall";
import VideoCall from "./pages/VideoCall";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main App Routes */}
        <Route element={<MainLayout />}>
          <Route path="/chats" element={<ChatList />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/group/:id" element={<GroupChat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<UserSearch />} />
        </Route>

        {/* Call Routes (Fullscreen) */}
        <Route path="/call/audio" element={<AudioCall />} />
        <Route path="/call/video" element={<VideoCall />} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
