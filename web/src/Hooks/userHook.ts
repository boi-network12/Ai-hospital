import { UserContext } from "@/context/UserContext";
import { useContext } from "react";

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};