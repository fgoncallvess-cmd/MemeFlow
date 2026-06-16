import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { PlusSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/feed/PostCard";
import CreateMemeDialog from "@/components/feed/CreateMemeDialog";
import RightSidebar from "@/components/layout/RightSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import type { PostWithProfile } from "@/types/database";
import { useInView } from "react-intersection-observer";

export default function FeedPage() {
  const { profile } = useAuth();
  const { activeModule } = useApp();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  // Initial load
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id(
              id,
              username,
              full_name,
              avatar_url,
              bio,
              humor_style,
              created_at
            ),
            likes(count)
          `)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        const postsWithCounts = (data || []).map((post: any) => ({
          ...post,
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: 0,
        }));

        setPosts(postsWithCounts);
      } catch (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Open create dialog when "create" module is selected
  useEffect(() => {
    if (activeModule === "create") setCreateOpen(true);
  }, [activeModule]);

  // Infinite scroll - removed mock data fallback
  useEffect(() => {
    if (inView && !loadingMore && !loading && hasMore) {
      setLoadingMore(true);
      
      const loadMorePosts = async () => {
        try {
          const { data, error } = await supabase
            .from("posts")
            .select(`
              *,
              profiles:user_id(
                id,
                username,
                full_name,
                avatar_url,
                bio,
                humor_style,
                created_at
              ),
              likes(count)
            `)
            .order("created_at", { ascending: false })
            .range(posts.length, posts.length + 9);

          if (error) throw error;

          if (!data || data.length === 0) {
            setHasMore(false);
            setLoadingMore(false);
            return;
          }

          const postsWithCounts = data.map((post: any) => ({
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            comments_count: 0,
          }));

          setPosts(prev => [...prev, ...postsWithCounts]);
          setLoadingMore(false);
        } catch (error) {
          console.error("Error loading more posts:", error);
          setLoadingMore(false);
          setHasMore(false);
        }
      };

      loadMorePosts();
    }
  }, [inView, loadingMore, loading, hasMore, posts.length]);

  const handlePostCreated = (post: PostWithProfile) => {
    setPosts(prev => [post, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const firstName = profile?.full_name?.split(" ")[0] || "usuário";

  return (
    <div className="flex gap-6 min-h-full">
      {/* Main feed column */}
      <div className="flex-1 min-w-0">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-violet-900/20 border border-purple-700/30 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 select-none">
            <svg aria-hidden="true" viewBox="0 0 64 64" className="w-24 h-24 text-purple-400">
              <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.18" />
              <g fill="#fff">
                <circle cx="22" cy="26" r="3.5" />
                <circle cx="42" cy="26" r="3.5" />
                <path d="M20 40c3.5 5 11 7 16 7s12.5-2 16-7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Feed Personalizado</span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Bem-vindo(a) de volta, {firstName}!</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 text-purple-400">
                  <path fill="currentColor" d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm12-2.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5S12.5 12.328 12.5 11.5 13.172 9.5 14 9.5zM8 9.5c.828 0 1.5.672 1.5 1.5S8.828 12.5 8 12.5 6.5 11.828 6.5 11 7.172 9.5 8 9.5zM8 15.5c1.5 1 3.5 1 5 0" />
                </svg>
              </h2>
              <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>Pronto para rir um pouco?</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 text-purple-400">
                  <path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7 10c1.5-2 5-2 6.5 0" />
                </svg>
              </p>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="shrink-0 hidden sm:flex gap-2"
            >
              <PlusSquare className="w-4 h-4" />
              Publicar Meme
            </Button>
          </div>
        </motion.div>

        {/* Mobile create button */}
        <div className="sm:hidden mb-4">
          <Button
            variant="gradient"
            className="w-full gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <PlusSquare className="w-4 h-4" />
            Publicar Meme
          </Button>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-14 h-14 text-zinc-400">
                <path fill="currentColor" d="M4 6h16v12H4z" opacity="0.12" />
                <path fill="currentColor" d="M20 6H4v12h16V6zm-8 7a3 3 0 110-6 3 3 0 010 6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Nenhum meme publicado ainda</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-sm">
              Seja o primeiro a publicar um meme incrível e inspire a comunidade!
            </p>
            <Button
              variant="gradient"
              onClick={() => setCreateOpen(true)}
              className="gap-2"
            >
              <PlusSquare className="w-4 h-4" />
              Publicar Meme
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PostCard
                  post={post}
                  onDelete={handlePostDeleted}
                />
              </motion.div>
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-4" />

            {loadingMore && (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            )}

            {!hasMore && (
              <div className="text-center py-8 text-zinc-500 text-sm flex items-center justify-center gap-2">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 text-zinc-400">
                  <path fill="currentColor" d="M12 2l1.5 4.5L18 8l-4 2 1 4.5L12 12l-4 2 1-4.5L6 8l4.5-1.5L12 2z" />
                </svg>
                <span>Você chegou ao fim do feed! Volte mais tarde para novos memes.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <RightSidebar />

      {/* Create meme dialog */}
      <CreateMemeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handlePostCreated}
      />
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="flex gap-3 pt-2 border-t border-zinc-800">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg ml-auto" />
      </div>
    </div>
  );
}
