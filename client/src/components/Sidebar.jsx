import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users2,
  FileUp,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Users,
  Activity,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Project Manager', 'Team Member', 'Client'] },
    { name: 'Projects', path: '/projects', icon: FolderKanban, roles: ['Admin', 'Project Manager', 'Team Member', 'Client'] },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, roles: ['Admin', 'Project Manager', 'Team Member', 'Client'] },
    { name: 'Clients', path: '/clients', icon: Users2, roles: ['Admin', 'Project Manager', 'Team Member'] }, // clients hidden from Client role
    { name: 'Deliverables', path: '/deliverables', icon: FileUp, roles: ['Admin', 'Project Manager', 'Team Member', 'Client'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['Admin', 'Project Manager', 'Client'] }, // Hide reports from standard Team Members for security
    { name: 'Team', path: '/team', icon: Users, roles: ['Admin', 'Project Manager', 'Team Member'] }, // clients don't see internal team directory
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['Admin', 'Project Manager', 'Team Member', 'Client'], badge: unreadCount },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['Admin', 'Project Manager', 'Team Member', 'Client'] },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {/* Sidebar background overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-900 border-r border-zinc-800 text-zinc-300 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/10 neon-glow">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Client<span className="text-indigo-500">Sync</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3.5 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name}
              className="h-10 w-10 rounded-lg bg-zinc-800 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mt-0.5">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 px-4 py-4 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-3.5'
                      : 'hover:bg-zinc-850 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4.5 w-4.5 shrink-0 group-hover:scale-105 transition-transform" />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition duration-150 group"
          >
            <LogOut className="h-4.5 w-4.5 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
