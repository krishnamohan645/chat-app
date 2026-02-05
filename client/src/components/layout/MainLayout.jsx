import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useDispatch } from "react-redux";
import { getMyProfile } from "../../features/user/userSlice";

const MainLayout = () => {
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);
  
  return (
    <div className="min-h-screen bg-background bg-gray-900">
      <TopNav
        onMenuClick={() => setSidebarOpen(true)}
        unreadNotifications={3}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-64 pb-20 lg:pb-0">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default MainLayout;
