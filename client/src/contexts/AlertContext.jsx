import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState(null);

  const showAlert = useCallback((title, message, type = 'info', onConfirm = null, onCancel = null) => {
    setAlertConfig({ title, message, type, onConfirm, onCancel });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      {alertConfig && (
        <AlertModal
          config={alertConfig}
          onClose={closeAlert}
        />
      )}
    </AlertContext.Provider>
  );
};

const AlertModal = ({ config, onClose }) => {
  const { title, message, type, onConfirm, onCancel } = config;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      if (callback) callback();
    }, 200); // Wait for exit animation
  };

  const getIcon = () => {
    switch (type) {
      case 'warning': return { icon: 'warning', color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'error': return { icon: 'error', color: 'text-red-600', bg: 'bg-red-100' };
      case 'success': return { icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-100' };
      case 'info':
      default: return { icon: 'info', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const iconConfig = getIcon();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-foreground/30 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => handleClose(onCancel)}
      />

      {/* Modal Box */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 overflow-hidden transition-all duration-200 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconConfig.bg}`}>
            <span className={`material-symbols-outlined text-2xl ${iconConfig.color}`}>
              {iconConfig.icon}
            </span>
          </div>

          <div className="space-y-1">
            <h3 id="alert-title" className="text-lg font-bold text-text-main">
              {title}
            </h3>
            <p className="text-sm text-text-body">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full pt-4">
            {onCancel && (
              <button
                onClick={() => handleClose(onCancel)}
                className="flex-1 px-4 py-2 rounded-lg bg-surface-soft border border-border-soft text-text-main font-semibold text-sm hover:bg-border-soft transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => handleClose(onConfirm)}
              className={`flex-1 px-4 py-2 rounded-lg text-black hover:text-white font-semibold text-sm transition-colors shadow-sm ${type === 'error' || type === 'warning' ? 'bg-destructive hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
                }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
