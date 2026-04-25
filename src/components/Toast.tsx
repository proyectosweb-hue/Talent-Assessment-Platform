import React, { useCallback, useState, createContext, useContext } from 'react';
import {
  CheckCircle2Icon,
  XCircleIcon,
  InfoIcon,
  AlertCircleIcon,
  XIcon } from
'lucide-react';
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
export function ToastProvider({ children }: {children: React.ReactNode;}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Math.random().toString(36).substring(7);
      const newToast = {
        id,
        message,
        type
      };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    []
  );
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  return (
    <ToastContext.Provider
      value={{
        showToast
      }}>
      
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) =>
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        )}
      </div>
    </ToastContext.Provider>);

}
function ToastItem({
  toast,
  onRemove



}: {toast: Toast;onRemove: (id: string) => void;}) {
  const icons = {
    success: CheckCircle2Icon,
    error: XCircleIcon,
    info: InfoIcon,
    warning: AlertCircleIcon
  };
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };
  const iconStyles = {
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600'
  };
  const Icon = icons[toast.type];
  return (
    <div
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] animate-slide-in ${styles[toast.type]}`}>
      
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconStyles[toast.type]}`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity">
        
        <XIcon className="w-4 h-4" />
      </button>
    </div>);

}