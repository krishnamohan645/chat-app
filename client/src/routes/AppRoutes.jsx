import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import MainLayout from "../components/layout/MainLayout";
import Register from "../pages/Register";
import ChatList from "../pages/ChatList";
import Chat from "../pages/Chat";
import Groups from "../pages/Groups";
import GroupChat from "../pages/GroupChat";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import EditProfile from "../pages/EditProfile";
import Settings from "../pages/Settings";
import UserSearch from "../pages/UserSearch";
import AudioCall from "../pages/AudioCall";
import VideoCall from "../pages/VideoCall";
import NotFound from "../pages/NotFound";
import PublicRoutes from "./PublicRoutes";
import ProtectedRoute from "./ProtectedRoutes";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      {/* Main App Routes */}
      <Route element={<ProtectedRoute />}>
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
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* Call Routes (Fullscreen) */}
        <Route path="/call/audio" element={<AudioCall />} />
        <Route path="/call/video" element={<VideoCall />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
