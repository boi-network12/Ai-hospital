// src/context/ToastContext.tsx
import React, { createContext, useState, ReactNode } from "react";
import { ToastAlert } from "@/modals/ToastAlert";

type ToastType = "info" | "success" | "error" | "warning";

interface ToastOptions {
  message: string;
  type?: ToastType;
}

interface ToastContextProps {
  showAlert: (opts: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<
    ToastOptions & { visible: boolean; key: number }
  >({
    visible: false,
    message: "",
    type: "info",
    key: 0,
  });

  const showAlert = (options: ToastOptions) => {
    setToast({
      message: options.message,
      type: options.type ?? "info",
      visible: true,
      key: Date.now(),
    });
  };

  const hide = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showAlert }}>
      {children}
      <ToastAlert
        key={toast.key}
        visible={toast.visible}
        message={toast.message}
        type={toast.type as ToastType}
        onHide={hide}
      />
    </ToastContext.Provider>
  );
};