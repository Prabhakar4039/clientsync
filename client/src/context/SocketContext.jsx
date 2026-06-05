import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // If no authenticated user, disconnect socket
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect using Vite proxy configuration (or production Render API URL)
    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.io connected successfully:', newSocket.id);
      // Join private user room for notifications
      newSocket.emit('join_user', user._id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
