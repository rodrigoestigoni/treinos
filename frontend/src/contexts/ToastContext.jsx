import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(null);
      }, duration);
    }
  };

  const hideToast = () => {
    setToast(null);
  };

  const successToast = (message, duration) => showToast(message, 'success', duration);
  const errorToast = (message, duration) => showToast(message, 'error', duration);
  const infoToast = (message, duration) => showToast(message, 'info', duration);
  const warningToast = (message, duration) => showToast(message, 'warning', duration);

  return (
    <ToastContext.Provider
      value={{
        toast,
        showToast,
        hideToast,
        successToast,
        errorToast,
        infoToast,
        warningToast
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};