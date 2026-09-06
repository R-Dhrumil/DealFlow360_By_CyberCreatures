import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocketEvent } from '../hooks/useSocket';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((type, message, duration = 4500, title = null, link = null) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, title, link, duration }]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Real-time toast notifications via shared socket
  useSocketEvent('notification', useCallback((data) => {
    if (data) {
      showNotification(
        data.type || 'info',
        data.message,
        data.duration || 5000,
        data.title,
        data.link
      );
    }
  }, [showNotification]));

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md w-full px-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { type, title, message, link, duration } = notification;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    const removeTimer = setTimeout(() => {
      onClose();
    }, duration + 300);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          icon: 'check_circle',
          badge: 'Success',
        };
      case 'error':
        return {
          bg: 'bg-red-950/90 border-red-500/40 text-red-100',
          iconBg: 'bg-red-500/20 text-red-400',
          icon: 'error',
          badge: 'Action Needed',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/40 text-amber-100',
          iconBg: 'bg-amber-500/20 text-amber-400',
          icon: 'warning',
          badge: 'System Alert',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 border-blue-500/40 text-slate-100',
          iconBg: 'bg-blue-500/20 text-blue-400',
          icon: 'notifications',
          badge: 'Notification',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`pointer-events-auto backdrop-blur-md border shadow-2xl rounded-xl p-4 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      } ${theme.bg}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${theme.iconBg}`}>
          <span className="material-symbols-outlined text-xl">{theme.icon}</span>
        </div>

        <div className="flex-1 min-w-0 pr-2">
          {title ? (
            <h4 className="text-sm font-semibold tracking-wide text-white leading-tight mb-1">
              {title}
            </h4>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-wider opacity-75 block mb-0.5">
              {theme.badge}
            </span>
          )}
          <p className="text-xs text-slate-200 leading-snug">{message}</p>

          {link && (
            <a
              href={link}
              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>View Details</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </a>
          )}
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Close notification"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};
