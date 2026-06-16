import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Compass, PlusSquare, Bell, MessageCircle,
  User, Settings, LogOut, ChevronLeft, ChevronRight, Laugh
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "create", label: "Criar Meme", icon: PlusSquare },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "chat", label: "Mensagens", icon: MessageCircle },
  { id: "profile", label: "Meu Perfil", icon: User },
  { id: "settings", label: "Configurações", icon: Settings },
] as const;

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const {
    activeModule, setActiveModule,
    sidebarCollapsed, setSidebarCollapsed,
    unreadMessages, unreadNotifications,
    setSelectedUserId,
  } = useApp();

  const badges: Record<string, number> = {
    notifications: unreadNotifications,
    chat: unreadMessages,
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col fixed left-0 top-14 bottom-0 z-40 bg-zinc-950/95 border-r border-zinc-800/50 backdrop-blur-sm overflow-hidden"
    >
      {/* Toggle button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all z-50 shadow-lg"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeModule === id;
          const badge = badges[id] || 0;

          return (
            <button
              key={id}
              onClick={() => {
                if (id === "profile") {
                  setSelectedUserId(null);
                }
                setActiveModule(id as any);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group relative",
                isActive
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
              )}
            >
              <div className="relative shrink-0">
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-purple-400" : "")} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full"
                />
              )}

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-zinc-700">
                  {label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="p-3 border-t border-zinc-800/50">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-zinc-800/60 transition-all",
          sidebarCollapsed && "justify-center"
        )} onClick={() => {
          setSelectedUserId(null);
          setActiveModule("profile");
        }}>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {profile ? getInitials(profile.full_name) : "?"}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium text-zinc-100 truncate">{profile?.full_name}</p>
                <p className="text-xs text-zinc-400 truncate">@{profile?.username}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/10 transition-all mt-1",
            sidebarCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
