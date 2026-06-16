import React, { createContext, useContext, useState } from "react";

type ActiveModule = "feed" | "explore" | "create" | "notifications" | "chat" | "profile" | "settings";

interface AppContextType {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  unreadMessages: number;
  setUnreadMessages: (v: number) => void;
  unreadNotifications: number;
  setUnreadNotifications: (v: number) => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<ActiveModule>("feed");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{
      activeModule, setActiveModule,
      sidebarCollapsed, setSidebarCollapsed,
      unreadMessages, setUnreadMessages,
      unreadNotifications, setUnreadNotifications,
      selectedUserId, setSelectedUserId,
      selectedConversationId, setSelectedConversationId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
