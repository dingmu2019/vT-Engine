import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-white dark:bg-slate-800 border-green-500',
    error: 'bg-white dark:bg-slate-800 border-red-500',
    info: 'bg-white dark:bg-slate-800 border-blue-500',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all animate-in slide-in-from-right-full duration-300 ${bgColors[toast.type]}`}>
      {icons[toast.type]}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{toast.message}</p>
      <button 
        onClick={() => onClose(toast.id)} 
        className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X size={14} />
      </button>
    </div>
  );
};