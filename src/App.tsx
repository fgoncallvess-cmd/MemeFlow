import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import AuthPage from "@/pages/AuthPage";
import FeedPage from "@/pages/FeedPage";
import ExplorePage from "@/pages/ExplorePage";
import ProfilePage from "@/pages/ProfilePage";
import ChatPage from "@/pages/ChatPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import { supabase } from "@/lib/supabase";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-purple-900/50 mx-auto mb-4 animate-pulse">
          <span className="text-2xl">😂</span>
        </div>
        <p className="text-zinc-400 text-sm">Carregando MemeFlow...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { activeModule, sidebarCollapsed, setUnreadNotifications, setUnreadMessages } = useApp();
  const { setActiveModule: setModule, setSelectedUserId, setSelectedConversationId, setSidebarCollapsed } = useApp();

  // Initialize unread counts from Supabase
  useEffect(() => {
    if (user) {
      const loadUnreadCounts = async () => {
        try {
          // Get unread notifications count
          const { data: notifs, error: notifError } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);
          
          if (!notifError && notifs) {
            setUnreadNotifications(notifs.length);
          }

          // Get unread messages count
          const { data: messages, error: msgError } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("recipient_id", user.id)
            .eq("read", false);
          
          if (!msgError && messages) {
            setUnreadMessages(messages.length);
          }
        } catch (err) {
          console.error("Error loading unread counts:", err);
        }
      };

      loadUnreadCounts();
    }
  }, [user, setUnreadNotifications, setUnreadMessages]);

  // Reset app-level state when user logs out or switches accounts
  useEffect(() => {
    if (!user) {
      // clear UI selections and counts
      setModule("feed");
      setSelectedUserId(null);
      setSelectedConversationId(null);
      setUnreadNotifications(0);
      setUnreadMessages(0);
      setSidebarCollapsed(false);
    }
  }, [user, setModule, setSelectedUserId, setSelectedConversationId, setUnreadNotifications, setUnreadMessages, setSidebarCollapsed]);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  const renderModule = () => {
    switch (activeModule) {
      case "feed": return <FeedPage />;
      case "explore": return <ExplorePage />;
      case "create": return <FeedPage />;
      case "notifications": return <NotificationsPage />;
      case "chat": return <ChatPage />;
      case "profile": return <ProfilePage />;
      case "settings": return <SettingsPage />;
      default: return <FeedPage />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Fixed Header */}
      <Header />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <motion.main
        animate={{
          marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024
            ? sidebarCollapsed ? 72 : 240
            : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="pt-14 pb-16 lg:pb-4 min-h-screen"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4 lg:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
