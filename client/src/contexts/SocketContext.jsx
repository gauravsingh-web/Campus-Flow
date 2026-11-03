import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotification, setRecentNotification] = useState(null);

  // Load initial notifications and unread count
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to CampusFlow real-time server');
    });

    // Real-time Event Handlers
    const handleIncomingAlert = (data, defaultTitle) => {
      setUnreadCount((prev) => prev + 1);
      setRecentNotification({
        title: data.title || defaultTitle,
        message: data.message || data.description || 'You have a new update.',
        type: data.type || 'info',
        timestamp: new Date(),
      });

      // Clear toast alert after 6 seconds
      setTimeout(() => {
        setRecentNotification((current) => (current?.timestamp === data.timestamp ? null : current));
      }, 6000);
    };

    socketInstance.on('announcement:new', (ann) => {
      handleIncomingAlert(ann, `New Announcement: ${ann.title}`);
    });

    socketInstance.on('notification:urgent', (ann) => {
      handleIncomingAlert(ann, `🚨 Urgent Campus Alert!`);
    });

    socketInstance.on('complaint:status_change', (comp) => {
      handleIncomingAlert(
        comp,
        `Complaint ${comp.complaintId} Updated: ${comp.status}`
      );
    });

    socketInstance.on('complaint:assigned', (comp) => {
      handleIncomingAlert(
        comp,
        `Assigned Grievance: ${comp.complaintId}`
      );
    });

    socketInstance.on('booking:status_change', (bkg) => {
      handleIncomingAlert(
        bkg,
        `Room Booking Updated: ${bkg.status}`
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, token]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        setUnreadCount,
        recentNotification,
        clearToast: () => setRecentNotification(null),
        refreshNotifications: fetchNotifications,
        markAllRead,
      }}
    >
      {children}
      {/* Global Real-time Toast Banner */}
      {recentNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-xl shadow-2xl p-4 flex items-start space-x-3 animate-bounce transition-all">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {recentNotification.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
              {recentNotification.message}
            </p>
          </div>
          <button
            onClick={() => setRecentNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
