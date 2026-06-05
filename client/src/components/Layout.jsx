import React, { useState } from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import ChatDrawer from './ChatDrawer';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Info, X } from 'lucide-react';

const Layout = () => {
  const { user, loading } = useAuth();
  const { toast, setToast } = useNotifications();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Protected route check
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine page title based on active pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Platform Dashboard';
    if (path.startsWith('/projects')) return 'Projects Management';
    if (path.startsWith('/tasks')) return 'Kanban Board & Tasks';
    if (path.startsWith('/clients')) return 'Clients Index';
    if (path.startsWith('/deliverables')) return 'Deliverables & Approvals';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/team')) return 'Internal Agency Team';
    if (path.startsWith('/notifications')) return 'Notification Feeds';
    if (path.startsWith('/settings')) return 'Settings';
    return 'ClientSync Workspace';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          title={getPageTitle()}
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleChat={() => setChatOpen(!chatOpen)}
        />

        {/* Page Inner Container */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>

      {/* Realtime Chat Drawer */}
      <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Real-time Toast Alerts Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-indigo-500/20 bg-white dark:bg-zinc-900 p-4 shadow-2xl animate-bounce neon-glow flex items-start space-x-3">
          <div className="rounded-lg bg-indigo-600/10 p-1.5 text-indigo-500 dark:text-indigo-400">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-semibold text-zinc-900 dark:text-white">{toast.title}</h5>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
