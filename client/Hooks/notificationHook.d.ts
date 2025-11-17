import { NotificationContext } from "@/context/NotificationContext";
import { useContext } from "react";

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
