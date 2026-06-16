import { Home, Compass, PlusSquare, Bell, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "create", label: "Criar", icon: PlusSquare },
  { id: "notifications", label: "Notifs", icon: Bell },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Perfil", icon: User },
] as const;

export default function BottomNav() {
  const { activeModule, setActiveModule, unreadMessages, unreadNotifications, setSelectedUserId } = useApp();

  const badges: Record<string, number> = {
    notifications: unreadNotifications,
    chat: unreadMessages,
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-zinc-950/95 border-t border-zinc-800/50 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around h-14 px-2">
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
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-0 flex-1 relative",
                isActive ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute inset-0 bg-purple-600/10 rounded-xl border border-purple-600/20"
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5 relative z-10" />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium relative z-10", isActive ? "text-purple-400" : "")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
