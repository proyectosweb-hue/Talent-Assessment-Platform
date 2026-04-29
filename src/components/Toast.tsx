import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {}
});

export const useToast = () => useContext(ToastContext);

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-500 text-white'
};

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
};

export const ToastProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) =>
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-slide-in pointer-events-auto min-w-[260px] max-w-[380px] ${styles[toast.type]}`}>
          
            <span className="text-base leading-none">{icons[toast.type]}</span>
            <span className="flex-1">{toast.message}</span>
            <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="opacity-70 hover:opacity-100 transition-opacity text-lg leading-none">
            
              ✕
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>);

};