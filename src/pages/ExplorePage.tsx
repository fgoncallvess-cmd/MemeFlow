import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Play, UserPlus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { TRENDING_CATEGORIES } from "@/data/mockData";
import { getInitials, formatCount } from "@/lib/utils";
import type { PostWithProfile, Profile } from "@/types/database";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const { setActiveModule, setSelectedUserId } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<PostWithProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!query && !selectedCategory) {
      setFilteredPosts([]);
      setFilteredUsers([]);
      return;
    }

    const searchContent = async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        
        if (q) {
          // Search users
          const { data: users, error: usersError } = await supabase
            .from("profiles")
            .select("*")
            .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
            .limit(10);

          if (!usersError) {
            setFilteredUsers(users || []);
          }

          // Search posts
          const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select(`
              *,
              profiles:user_id(*),
              likes(count)
            `)
            .or(`title.ilike.%${q}%,category.ilike.%${q}%`)
            .limit(20);

          if (!postsError) {
            const postsWithCounts = (posts || []).map((post: any) => ({
              ...post,
              likes_count: post.likes?.[0]?.count || 0,
              comments_count: 0,
            }));
            setFilteredPosts(postsWithCounts);
          }
        } else if (selectedCategory) {
          setFilteredUsers([]);
          const { data: posts, error } = await supabase
            .from("posts")
            .select(`
              *,
              profiles:user_id(*),
              likes(count)
            `)
            .eq("category", selectedCategory)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!error) {
            const postsWithCounts = (posts || []).map((post: any) => ({
              ...post,
              likes_count: post.likes?.[0]?.count || 0,
              comments_count: 0,
            }));
            setFilteredPosts(postsWithCounts);
          }
        }
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      searchContent();
    }, 400);

    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  const handleProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setActiveModule("profile");
  };

  const toggleFollow = (userId: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const showResults = query || selectedCategory;

  useEffect(() => {
    // Load post counts for each trending category; default to 0
    const loadCounts = async () => {
      try {
        const entries = await Promise.all(
          TRENDING_CATEGORIES.map(async (cat) => {
            const { count, error } = await supabase
              .from("posts")
              .select("id", { count: "exact", head: true })
              .eq("category", cat.name);

            return { name: cat.name, count: error ? 0 : (count || 0) };
          })
        );

        const map: Record<string, number> = {};
        entries.forEach(e => { map[e.name] = e.count; });
        setCategoryCounts(map);
      } catch (err) {
        console.error("Error loading category counts:", err);
      }
    };

    loadCounts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <Input
          placeholder="Buscar usuários, memes, categorias, hashtags..."
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedCategory(null); }}
          className="pl-12 h-11 text-base rounded-xl border-zinc-700 bg-zinc-900/80 focus:ring-purple-500"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
          >
            ✕
          </button>
        )}
      </div>

      {/* Trending Categories */}
      {!showResults && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-zinc-100">Categorias em Alta</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TRENDING_CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex items-center gap-3 p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl hover:border-purple-600/40 hover:bg-purple-900/10 transition-all group text-left"
              >
                <div className="w-8 h-8 text-purple-400" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                <div>
                  <p className="font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors">{cat.name}</p>
                  <p className="text-xs text-zinc-500">{`${formatCount(categoryCounts[cat.name] ?? 0)} memes`}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Category filter chips */}
      {!query && (
        <div className="flex flex-wrap gap-2">
          {TRENDING_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium border transition-all",
                selectedCategory === cat.name
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-purple-600/50 hover:text-zinc-200"
              )}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Search results */}
      {showResults && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Users */}
              {filteredUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Usuários ({filteredUsers.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-purple-600/30 transition-all"
                      >
                        <button
                          onClick={() => handleProfileClick(user.id)}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <Avatar className="w-11 h-11 ring-2 ring-purple-600/20">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-200 truncate">{user.full_name}</p>
                            <p className="text-sm text-zinc-500 truncate">@{user.username}</p>
                            {user.humor_style && (
                              <Badge variant="category" className="mt-1 text-[10px]">{user.humor_style}</Badge>
                            )}
                          </div>
                        </button>
                        <Button
                          size="sm"
                          variant={following.has(user.id) ? "secondary" : "default"}
                          onClick={() => toggleFollow(user.id)}
                          className="shrink-0"
                        >
                          {following.has(user.id) ? (
                            <><Check className="w-3 h-3 mr-1" />Seguindo</>
                          ) : (
                            <><UserPlus className="w-3 h-3 mr-1" />Seguir</>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts grid */}
              {filteredPosts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    {selectedCategory ? `${selectedCategory}` : "Memes"} ({filteredPosts.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredPosts.map(post => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group cursor-pointer hover:border-purple-600/40 transition-all"
                        onClick={() => handleProfileClick(post.user_id)}
                      >
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-zinc-900">
                          <Play className="w-8 h-8 text-zinc-600" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <p className="text-white text-xs font-medium line-clamp-2">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-zinc-300 text-xs">❤️ {formatCount(post.likes_count)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {filteredPosts.length === 0 && filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <span className="text-5xl">🔍</span>
                  <p className="text-zinc-400 mt-4 font-medium">Nenhum resultado encontrado</p>
                  <p className="text-zinc-500 text-sm mt-1">Tente outro termo ou categoria</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state when no search */}
      {!showResults && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-zinc-400 font-medium">Use a barra de busca para encontrar</p>
          <p className="text-zinc-500 text-sm mt-1">Procure por usuários, memes, categorias ou hashtags</p>
        </div>
      )}
    </div>
  );
}
