import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { formatTime, getInitials } from "@/lib/utils";
import type { CommentWithProfile } from "@/types/database";

interface CommentsSheetProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function CommentsSheet({ postId, open, onClose }: CommentsSheetProps) {
  const { profile } = useAuth();
  const { setSelectedUserId, setActiveModule } = useApp();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load comments when sheet opens
  useEffect(() => {
    if (open && postId) {
      loadComments();
    }
  }, [open, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;
    setSubmitting(true);

    try {
      // Insert comment to Supabase
      const { data, error } = await supabase
        .from("comments")
        .insert([{
          post_id: postId,
          user_id: profile.id,
          content: newComment.trim(),
          likes_count: 0,
          created_at: new Date().toISOString(),
        }] as any)
        .select("*, profiles(*)") as any;

      if (error) throw error;

      // Add new comment to list
      if (data && data[0]) {
        setComments(prev => [...prev, data[0]]);
      }

      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-h-[80vh] flex flex-col lg:max-w-lg lg:left-1/2 lg:-translate-x-1/2 lg:rounded-2xl lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-zinc-100">Comentários</h3>
            <span className="text-sm text-zinc-500">({comments.length})</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 text-sm">✕</button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-1/3" />
                    <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">Sem comentários ainda</p>
              <p className="text-zinc-500 text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId(comment.profiles.id);
                    setActiveModule("profile");
                  }}
                  className="flex items-center shrink-0"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.profiles.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(comment.profiles.full_name || 'User')}</AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1 bg-zinc-900 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(comment.profiles.id);
                        setActiveModule("profile");
                      }}
                      className="text-sm font-semibold text-zinc-200 hover:text-purple-300 transition-colors"
                    >
                      {comment.profiles.full_name}
                    </button>
                    <span className="text-xs text-zinc-500">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{comment.content}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile ? getInitials(profile.full_name || 'You') : "?"}
              </AvatarFallback>
            </Avatar>
            <Input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Adicionar comentário..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || submitting}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
