import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Menu, Sun, Moon, Search, Bell, MessageSquare, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopNavbar = ({ onOpenSidebar, onToggleChat, title }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') !== 'light'
  );

  // Sync dark mode class on HTML node
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md px-6 text-zinc-900 dark:text-zinc-50">
      {/* Mobile Sidebar Trigger & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 lg:hidden text-zinc-500 dark:text-zinc-400"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold tracking-tight font-display hidden sm:block">
          {title || 'Dashboard'}
        </h2>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggler */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors duration-150"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Realtime Chat Button */}
        <button
          onClick={onToggleChat}
          className="relative rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors duration-150"
          title="Open Collaboration Chat"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          {/* Green dot for online realtime availability */}
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-950"></span>
        </button>

        {/* Notifications Bell */}
        <Link
          to="/notifications"
          className="relative rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors duration-150 block"
          title="Notifications Feed"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User initials bubble */}
        <div className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
            alt={user?.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
