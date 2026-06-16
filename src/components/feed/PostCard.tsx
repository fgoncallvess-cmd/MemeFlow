import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import VideoPlayer from "./VideoPlayer";
import CommentsSheet from "./CommentsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { formatCount, formatTime, getInitials } from "@/lib/utils";
import type { PostWithProfile } from "@/types/database";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PostCardProps {
  post: PostWithProfile;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const { setActiveModule, setSelectedUserId } = useApp();
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [heartAnim, setHeartAnim] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const isOwner = user?.id === post.user_id;

  const handleLike = async () => {
    if (!user) return;
    
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    if (newLiked) {
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 400);
      
      // Save like to database
      try {
        await supabase.from("likes").insert({
          user_id: user.id,
          post_id: post.id,
        } as any);
      } catch (error) {
        console.error("Error saving like:", error);
        // Revert if failed
        setLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      // Remove like from database
      try {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", post.id);
      } catch (error) {
        console.error("Error removing like:", error);
        // Revert if failed
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post.title || 'Check this out', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleProfileClick = () => {
    setSelectedUserId(post.user_id);
    setActiveModule("profile");
  };

  const handleDelete = () => {
    onDelete?.(post.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-600/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <Avatar className="w-10 h-10 ring-2 ring-purple-600/30">
                <AvatarImage src={post.profiles.avatar_url || undefined} />
                <AvatarFallback>{getInitials(post.profiles.full_name || 'User')}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-zinc-100">{post.profiles.full_name}</p>
              <p className="text-xs text-zinc-400">@{post.profiles.username} · {formatTime(post.created_at)}</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="h-7 w-7">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSaved(!saved)}>
                  <Bookmark className={cn("w-4 h-4 mr-2", saved && "fill-purple-400 text-purple-400")} />
                  {saved ? "Remover dos salvos" : "Salvar post"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-400 focus:text-red-400 focus:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <h3 className="font-semibold text-zinc-100 text-sm mb-1">{post.title}</h3>
          {post.description && (
            <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">{post.description}</p>
          )}
        </div>

        {/* Video */}
        <VideoPlayer
          src={post.video_url}
          thumbnail={post.thumbnail_url}
          className="mx-4 mb-3 rounded-xl overflow-hidden"
        />

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-4 pt-1 border-t border-zinc-800/50">
          <div className="flex items-center gap-1">
            {/* Like button */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-all group"
            >
              <motion.div
                animate={heartAnim ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    liked
                      ? "fill-red-500 text-red-500"
                      : "text-zinc-400 group-hover:text-red-400"
                  )}
                />
              </motion.div>
              <span className={cn(
                "text-sm font-medium transition-colors",
                liked ? "text-red-400" : "text-zinc-400 group-hover:text-zinc-200"
              )}>
                {formatCount(likesCount)}
              </span>
            </button>

            {/* Comment button */}
            <button
              onClick={() => setCommentsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-all group"
            >
              <MessageCircle className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {formatCount(post.comments_count)}
              </span>
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-all group"
          >
            <Share2 className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
            <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors hidden sm:block">
              Compartilhar
            </span>
          </button>
        </div>
      </motion.div>

      {/* Comments Sheet */}
      <CommentsSheet
        postId={post.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O post será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
