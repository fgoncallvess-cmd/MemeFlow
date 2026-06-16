import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Image, Circle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { getUserConversations } from "@/lib/supabaseHelpers";
import { formatTime, getInitials } from "@/lib/utils";
import type { ConversationWithDetails, MessageWithProfile, Profile } from "@/types/database";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { profile } = useAuth();
  const { selectedConversationId, setSelectedConversationId, setSelectedUserId, setActiveModule, selectedUserId } = useApp();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  const activeConversation = conversations.find(c => c.id === selectedConversationId) || null;
  const otherParticipant = activeConversation?.participants.find(p => p.id !== profile?.id) || null;

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserConversations(profile.id as string);
        setConversations(data || []);
      } catch (error) {
        console.error("Error loading conversations:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [profile]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversationId) {
      const loadMessages = async () => {
        setLoadingMessages(true);

        try {
          const { data, error } = await supabase
            .from("messages")
            .select(`
              *,
              profiles:sender_id(*)
            `)
            .eq("conversation_id", selectedConversationId)
            .order("created_at", { ascending: true });

          if (error) throw error;

          setMessages(data || []);
        } catch (error) {
          console.error("Error loading messages:", error);
          setMessages([]);
        } finally {
          setLoadingMessages(false);
        }
      };

      loadMessages();
    }
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !profile || !selectedConversationId) return;
    setSending(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversationId,
          sender_id: profile.id,
          content: newMessage.trim(),
          image_url: null,
        })
        .select("*, profiles:sender_id(*)")
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => [...prev, data]);
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const other = conv.participants.find(p => p.id !== profile?.id);
    return !searchQuery || other?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Conversations list */}
      <div className={cn(
        "flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden",
        selectedConversationId ? "hidden md:flex md:w-72 md:shrink-0" : "flex-1 md:w-72 md:flex-none md:shrink-0"
      )}>
        {/* List header */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-bold text-zinc-100 mb-3">Mensagens</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-purple-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-zinc-400 font-medium text-sm">Nenhuma conversa encontrada</p>
              <p className="text-zinc-500 text-xs mt-1 text-center">Inicie uma conversa com alguém para começar</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = conv.participants.find(p => p.id !== profile?.id);
              const isActive = conv.id === selectedConversationId;

            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-zinc-800/60 transition-all text-left border-b border-zinc-800/30 cursor-pointer",
                  isActive && "bg-purple-900/20 border-l-2 border-l-purple-600"
                )}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (other) {
                      setSelectedUserId(other.id);
                      setActiveModule("profile");
                    }
                  }}
                  className="relative shrink-0"
                >
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={other?.avatar_url || undefined} />
                    <AvatarFallback>{other ? getInitials(other.full_name) : "?"}</AvatarFallback>
                  </Avatar>
                  <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 fill-green-500 text-green-500 bg-zinc-900 rounded-full" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (other) {
                          setSelectedUserId(other.id);
                          setActiveModule("profile");
                        }
                      }}
                      className="font-semibold text-sm text-zinc-200 truncate text-left hover:text-purple-300 transition-colors"
                    >
                      {other?.full_name}
                    </button>
                    <span className="text-xs text-zinc-500 shrink-0 ml-1">
                      {conv.last_message ? formatTime(conv.last_message.created_at) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 truncate">{conv.last_message?.content || "Sem mensagens"}</span>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="ml-1 shrink-0 w-4 h-4 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      {selectedConversationId ? (
        <div className="flex-1 flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
            <button
              onClick={() => setSelectedConversationId(null)}
              className="md:hidden text-zinc-400 hover:text-zinc-100 mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (otherParticipant) {
                  setSelectedUserId(otherParticipant.id);
                  setActiveModule("profile");
                } else if (selectedUserId) {
                  setActiveModule("profile");
                }
              }}
              className="flex items-center gap-3"
            >
            <div className="relative">
              <Avatar className="w-9 h-9">
                <AvatarImage src={otherParticipant?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {otherParticipant ? getInitials(otherParticipant.full_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-green-500 text-green-500 bg-zinc-950 rounded-full" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-zinc-100 text-sm">{otherParticipant?.full_name}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === profile?.id;
                const prevMsg = messages[i - 1];
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
                  >
                    {!isMe && (
                      <div className="w-7 h-7 shrink-0 mt-auto">
                        {showAvatar && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={msg.profiles.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(msg.profiles.full_name)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                      isMe
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                    )}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="Imagem" className="rounded-lg mb-2 max-w-full" />
                      )}
                      <p>{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1 text-right",
                        isMe ? "text-purple-200/70" : "text-zinc-500"
                      )}>
                        {formatTime(msg.created_at)}
                        {isMe && msg.read_at && " ✓✓"}
                        {isMe && !msg.read_at && " ✓"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input */}
          <div className="p-3 border-t border-zinc-800">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <button
                type="button"
                className="p-2 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 transition-all"
              >
                <Image className="w-5 h-5" />
              </button>
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || sending}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          <div className="text-center">
            <span className="text-6xl">💬</span>
            <p className="text-zinc-400 font-medium mt-4">Selecione uma conversa</p>
            <p className="text-zinc-500 text-sm mt-1">para começar a chatear</p>
          </div>
        </div>
      )}
    </div>
  );
}
