import { AlertContext } from "@/context/AlertContext";
import { useContext } from "react";

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within AlertProvider');
  return context;
};