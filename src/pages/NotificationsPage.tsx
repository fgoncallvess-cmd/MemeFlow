import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, UserPlus, MessageCircle, Bell, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatTime, getInitials } from "@/lib/utils";
import type { Notification } from "@/types/database";
import { cn } from "@/lib/utils";

const NOTIF_ICONS = {
  like: { icon: Heart, color: "text-red-400", bg: "bg-red-900/20" },
  follow: { icon: UserPlus, color: "text-purple-400", bg: "bg-purple-900/20" },
  comment: { icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-900/20" },
};

function getNotifText(type: string, actorName: string): string {
  switch (type) {
    case "like": return `${actorName} curtiu seu meme`;
    case "follow": return `${actorName} começou a te seguir`;
    case "comment": return `${actorName} comentou no seu meme`;
    default: return `${actorName} interagiu com você`;
  }
}

export default function NotificationsPage() {
  const { setUnreadNotifications } = useApp();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications from Supabase
  useEffect(() => {
    const loadNotifications = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setNotifications(data || []);
        const unread = (data || []).filter(n => !n.read).length;
        setUnreadNotifications(unread);
      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [profile, setUnreadNotifications]);

  const markAllRead = async () => {
    if (!profile) return;

    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", profile.id);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const markRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      const unread = notifications.filter(n => !n.read && n.id !== id).length;
      setUnreadNotifications(unread);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-zinc-400">{unreadCount} novas notificações</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-2 text-purple-400">
            <Check className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full border-2 border-zinc-700 border-t-purple-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bell className="w-16 h-16 text-zinc-700 mb-4" />
          <p className="text-zinc-400 font-medium">Nenhuma notificação ainda</p>
          <p className="text-zinc-500 text-sm mt-1">Interaja com outros usuários!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const config = NOTIF_ICONS[notif.type as keyof typeof NOTIF_ICONS] || NOTIF_ICONS.like;
            const NotifIcon = config.icon;
            
            // Since actor data is in notification row, we'll fetch it separately or show placeholder
            const actorName = "Usuário"; // Placeholder - ideally notification would have actor name

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markRead(notif.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-zinc-800/40",
                  notif.read
                    ? "bg-zinc-900/40 border-zinc-800"
                    : "bg-zinc-900/80 border-purple-700/30 border-l-2 border-l-purple-600"
                )}
              >
                {/* Actor avatar with type icon */}
                <div className="relative shrink-0">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                    config.bg
                  )}>
                    <NotifIcon className={cn("w-3 h-3", config.color)} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">
                    <span className="font-semibold">{actorName}</span>
                    {" "}
                    <span className="text-zinc-400">{getNotifText(notif.type, actorName)}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatTime(notif.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0" />
                )}

                {/* Notification icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-900/40 to-zinc-800 rounded-lg shrink-0 flex items-center justify-center">
                  <span className="text-lg">🔔</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
