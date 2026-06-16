import { Laugh, Bell, MessageCircle, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { getInitials } from "@/lib/utils";

export default function Header() {
  const { profile } = useAuth();
  const { setActiveModule, setSelectedUserId, unreadMessages, unreadNotifications, setSidebarCollapsed, sidebarCollapsed } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-purple-900/20 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between h-full px-4 max-w-screen-2xl mx-auto">
        {/* Left: Logo + menu toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveModule("feed")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Laugh className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-purple-600 hidden sm:block">MemeFlow</span>
          </button>
        </div>

        {/* Center: search on desktop */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4">
          <button
            onClick={() => setActiveModule("explore")}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 text-sm hover:bg-zinc-800 hover:border-purple-600/30 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Buscar memes, usuários...</span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveModule("explore")}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveModule("notifications")}
            className="relative p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </motion.span>
            )}
          </button>

          <button
            onClick={() => setActiveModule("chat")}
            className="relative p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadMessages > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </motion.span>
            )}
          </button>

          <button
            onClick={() => {
              setSelectedUserId(null);
              setActiveModule("profile");
            }}
            className="ml-1 p-0.5 rounded-full ring-2 ring-transparent hover:ring-purple-600/50 transition-all"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile ? getInitials(profile.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}
