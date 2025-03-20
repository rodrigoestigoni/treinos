import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';

const Toast = () => {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const { message, type, id } = toast;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-50"
        >
          <div className={`rounded-lg shadow-lg p-4 text-white ${getTypeStyles()}`}>
            <div className="flex items-start justify-between">
              <p className="flex-grow">{message}</p>
              <button 
                onClick={hideToast}
                className="ml-4 text-white hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;