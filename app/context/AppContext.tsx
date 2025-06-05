"use client";

import { createContext, useContext } from "react";
import { useAppContext } from "../hooks/useAppContext";

const AppContext = createContext<ReturnType<typeof useAppContext> | null>(null);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const appContext = useAppContext();
  return <AppContext.Provider value={appContext}>{children}</AppContext.Provider>;
};

// Hook to access context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppContextProvider");
  return context;
};
