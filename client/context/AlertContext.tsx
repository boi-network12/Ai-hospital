// src/context/AlertContext.tsx
import React, { createContext, useState, ReactNode } from 'react';
import AlertModal from '@/modals/AlertModal';

type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: AlertType;
}

interface AlertContextProps {
  showAlert: (options: AlertOptions) => void;
}

export const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
  });

  const showAlert = (options: AlertOptions) => {
    setAlert({ ...options, visible: true });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const handleConfirm = () => {
    alert.onConfirm?.();
    hideAlert();
  };

  const handleCancel = () => {
    alert.onCancel?.();
    hideAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        type={alert.type || 'info'}
      />
    </AlertContext.Provider>
  );
};

