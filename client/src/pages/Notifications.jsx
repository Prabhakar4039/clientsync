import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, BellOff, Check, Trash2, CheckSquare, MessageSquare, AlertCircle, FileText, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'Task':
        return <CheckSquare className="h-4 w-4 text-indigo-500" />;
      case 'Project':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'Deliverable':
        return <FileText className="h-4 w-4 text-emerald-500" />;
      case 'Feedback':
        return <MessageSquare className="h-4 w-4 text-violet-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display flex items-center space-x-2">
            <Bell className="h-6 w-6 text-indigo-500" />
            <span>Notifications Feed</span>
          </h1>
          <p className="text-sm text-zinc-550 mt-1">
            Realtime updates regarding tasks assignments, file approvals, and reviews.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1.5 px-4 py-2 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Check className="h-4 w-4 text-emerald-500" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications feed list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <BellOff className="mx-auto h-10 w-10 text-zinc-300 mb-4" />
            <p className="text-xs font-medium">No notifications logged yet.</p>
            <p className="text-[10px] text-zinc-400 mt-1">Updates regarding tasks, deliverables, and projects will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4.5 flex items-start justify-between space-x-4 transition-colors ${
                  !notif.read ? 'bg-indigo-50/20 dark:bg-indigo-950/5' : ''
                }`}
              >
                {/* Icon & Message details */}
                <div className="flex items-start space-x-3.5 min-w-0">
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-2 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white leading-none">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-zinc-500 block">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-400 border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      View Link
                    </Link>
                  )}
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-emerald-500 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-red-500 transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
