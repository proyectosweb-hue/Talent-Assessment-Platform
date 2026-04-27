import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext({
  showToast: (message: string) => {}
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message &&
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in">
          {message}
        </div>
      }
    </ToastContext.Provider>);

};