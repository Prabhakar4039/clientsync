import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Fetch notifications from backend on login
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/notifications');
        if (res.data.success) {
          setNotifications(res.data.data);
          setUnreadCount(res.data.data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err.message);
      }
    };
    fetchNotifications();
  }, [user]);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (notification) => {
      console.log('Realtime notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Trigger temporary visual toast notification
      setToast({
        id: Date.now(),
        title: notification.title,
        message: notification.message,
      });

      // Clear toast after 5 seconds
      setTimeout(() => {
        setToast(null);
      }, 5000);
    });

    return () => {
      socket.off('new_notification');
    };
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      const res = await axios.put(`/api/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await axios.put('/api/notifications/readall');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await axios.delete(`/api/notifications/${id}`);
      if (res.data.success) {
        const wasUnread = !notifications.find(n => n._id === id)?.read;
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err.message);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toast,
        setToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationContext);
};
