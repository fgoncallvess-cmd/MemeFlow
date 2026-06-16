import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, UserPlus, UserMinus, MessageCircle, Grid3X3, Heart, Camera, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabase";
import { HUMOR_STYLES } from "@/data/mockData";
import { getInitials, formatCount } from "@/lib/utils";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkIfFollowing,
  createConversation,
} from "@/lib/supabaseHelpers";
import type { Profile, PostWithProfile } from "@/types/database";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, profile: currentProfile, updateProfile, loading } = useAuth();
  const { selectedUserId, setSelectedUserId, setActiveModule, setSelectedConversationId } = useApp();
  const [userPosts, setUserPosts] = useState<PostWithProfile[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [viewedOtherProfile, setViewedOtherProfile] = useState<Profile | null>(null);

  // Determine if viewing own profile or another user's
  const isOwnProfile = !selectedUserId || (user && selectedUserId === user.id);
  const viewedProfile = isOwnProfile ? currentProfile : viewedOtherProfile;

  // Only use viewedProfile directly - no fallback defaults
  const displayProfile: Profile | null = viewedProfile ?? null;

  // Load another user's profile if selectedUserId changes
  useEffect(() => {
    if (selectedUserId && user && selectedUserId !== user.id) {
      const loadOtherProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", selectedUserId)
            .single();

          if (!error && data) {
            setViewedOtherProfile(data as unknown as Profile);
          } else {
            console.error("Error loading other user profile:", error);
            setViewedOtherProfile(null);
          }
        } catch (err) {
          console.error("Error loading other user profile:", err);
          setViewedOtherProfile(null);
        }
      };
      loadOtherProfile();
    } else {
      setViewedOtherProfile(null);
    }
  }, [selectedUserId, user]);

  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Profile[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    full_name: string;
    username: string;
    bio: string;
    humor_style: string;
  }>({
    full_name: "",
    username: "",
    bio: "",
    humor_style: "",
  });
  const [saving, setSaving] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  // Sync editForm with current/viewed profile whenever it changes
  useEffect(() => {
    if (displayProfile) {
      setEditForm({
        full_name: displayProfile.full_name || "",
        username: displayProfile.username || "",
        bio: displayProfile.bio || "",
        humor_style: displayProfile.humor_style || "",
      });
    }
  }, [displayProfile?.id, isOwnProfile]);

  useEffect(() => {
    const loadFollowData = async () => {
      if (!displayProfile) return;

      try {
        const [followersData, followingData] = await Promise.all([
          getFollowers(displayProfile.id),
          getFollowing(displayProfile.id),
        ]);

        setFollowers((followersData || []).map(item => item.profiles).filter(Boolean));
        setFollowingUsers((followingData || []).map(item => item.profiles).filter(Boolean));

        if (currentProfile?.id && !isOwnProfile) {
          const isFollowing = await checkIfFollowing(currentProfile.id, displayProfile.id);
          setFollowing(isFollowing);
        } else {
          setFollowing(false);
        }
      } catch (error) {
        console.error("Error loading follow data:", error);
      }
    };

    loadFollowData();
  }, [displayProfile?.id, currentProfile?.id, isOwnProfile]);

  // Load user posts
  const loadUserPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id(*),
          likes(count)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithCounts = (data || []).map((post: any) => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: 0,
      }));

      setUserPosts(postsWithCounts);
    } catch (error) {
      console.error("Error loading user posts:", error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load posts when viewing profile
  useEffect(() => {
    const profileId = isOwnProfile ? currentProfile?.id : selectedUserId;
    if (profileId) {
      loadUserPosts(profileId);
    }
  }, [isOwnProfile, currentProfile?.id, selectedUserId]);

  const likedPosts: PostWithProfile[] = []; // Placeholder - would need likes table
  const followersCount = followers.length;
  const followingCount = followingUsers.length;

  const handleSaveProfile = async () => {
    // Validate fields
    if (!editForm.full_name.trim()) {
      alert("❌ Nome completo é obrigatório");
      return;
    }
    if (!editForm.username.trim()) {
      alert("❌ Username é obrigatório");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(editForm.username)) {
      alert("❌ Username deve conter apenas letras minúsculas, números e _");
      return;
    }

    setSaving(true);
    try {
      console.log("📤 Saving profile:", editForm);
      const { error } = await updateProfile(editForm);
      if (error) {
        console.error("❌ Error saving profile:", error);
        alert("Erro ao salvar perfil: " + error.message);
      } else {
        console.log("✅ Profile saved successfully");
        alert("✅ Perfil salvo com sucesso!");
        setEditOpen(false);
      }
    } catch (err) {
      console.error("❌ Exception saving profile:", err);
      alert("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isOwnProfile || !viewedProfile || !currentProfile) return;

    try {
      if (following) {
        await unfollowUser(currentProfile.id, viewedProfile.id);
        setFollowing(false);
        setFollowers(prev => prev.filter(user => user.id !== currentProfile.id));
      } else {
        await followUser(currentProfile.id, viewedProfile.id);
        setFollowing(true);
        if (currentProfile) {
          setFollowers(prev => [{ ...currentProfile }, ...prev]);
        }
      }
    } catch (error) {
      console.error("Error toggling follow state:", error);
    }
  };

  const handleSendMessage = async () => {
    if (isOwnProfile || !viewedProfile || !currentProfile) return;

    try {
      const { data: participantRows, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("user_id", [currentProfile.id, viewedProfile.id]);

      if (error) {
        throw error;
      }

      const conversationMap: Record<string, string[]> = {};
      participantRows?.forEach(row => {
        if (!conversationMap[row.conversation_id]) {
          conversationMap[row.conversation_id] = [];
        }
        conversationMap[row.conversation_id].push(row.user_id);
      });

      const existingConversationId = Object.entries(conversationMap).find(
        ([, participantIds]) =>
          participantIds.includes(currentProfile.id) && participantIds.includes(viewedProfile.id) && participantIds.length === 2
      )?.[0];

      if (existingConversationId) {
        setSelectedConversationId(existingConversationId);
        setActiveModule("chat");
        return;
      }

      const newConv = await createConversation([currentProfile.id, viewedProfile.id]);
      if (newConv) {
        setSelectedConversationId(newConv.id);
        setActiveModule("chat");
      }
    } catch (error) {
      console.error("Error opening conversation:", error);
    }
  };

  // If viewing another user's profile that doesn't exist, show skeleton/error
  if (!viewedProfile && !isOwnProfile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="p-4">
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button for viewing other profiles */}
      {!isOwnProfile && (
        <button
          onClick={() => setSelectedUserId(null)}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
        >
          ← Voltar
        </button>
      )}

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden"
      >
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-purple-900/60 via-violet-900/40 to-indigo-900/30 relative">
          <div className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(263 70% 30%) 0%, transparent 70%)" }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-zinc-950 shadow-xl">
                  <AvatarImage src={displayProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">{getInitials(displayProfile?.full_name || "")}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setEditForm({
                      full_name: currentProfile?.full_name || "",
                      username: currentProfile?.username || "",
                      bio: currentProfile?.bio || "",
                      humor_style: currentProfile?.humor_style || "",
                    });
                    setEditOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors shadow"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-14 sm:mt-0">
              {isOwnProfile ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditForm({
                      full_name: currentProfile?.full_name || "",
                      username: currentProfile?.username || "",
                      bio: currentProfile?.bio || "",
                      humor_style: currentProfile?.humor_style || "",
                    });
                    setEditOpen(true);
                  }}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    variant={following ? "secondary" : "gradient"}
                    size="sm"
                    onClick={handleFollowToggle}
                    className="gap-2"
                  >
                    {following ? (
                      <><UserMinus className="w-4 h-4" />Deixar de Seguir</>
                    ) : (
                      <><UserPlus className="w-4 h-4" />Seguir</>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSendMessage}
                    className="gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Mensagem</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{displayProfile?.full_name}</h1>
              <p className="text-zinc-400">@{displayProfile?.username}</p>
            </div>

            {displayProfile?.bio && (
              <p className="text-zinc-300 text-sm leading-relaxed">{displayProfile.bio}</p>
            )}

            {displayProfile?.humor_style && (
              <Badge variant="category">{displayProfile.humor_style}</Badge>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 pt-2">
              <div className="text-center">
                <p className="font-bold text-zinc-100 text-lg">{userPosts.length}</p>
                <p className="text-zinc-500 text-xs">Posts</p>
              </div>
              <button
                onClick={() => setFollowersOpen(true)}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <p className="font-bold text-zinc-100 text-lg">{formatCount(followersCount)}</p>
                <p className="text-zinc-500 text-xs">Seguidores</p>
              </button>
              <button
                onClick={() => setFollowingOpen(true)}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <p className="font-bold text-zinc-100 text-lg">{formatCount(followingCount)}</p>
                <p className="text-zinc-500 text-xs">Seguindo</p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1 gap-2">
            <Grid3X3 className="w-4 h-4" />
            Meus Memes ({userPosts.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 gap-2">
            <Heart className="w-4 h-4" />
            Curtidos ({likedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {userPosts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">📹</span>
              <p className="text-zinc-400 mt-4 font-medium">Nenhum meme publicado</p>
              <p className="text-zinc-500 text-sm mt-1">Crie seu primeiro meme!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {userPosts.map((post, i) => (
                <VideoThumbnail key={post.id} post={post} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked">
          {likedPosts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl">❤️</span>
              <p className="text-zinc-400 mt-4 font-medium">Nenhum meme curtido</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {likedPosts.map((post, i) => (
                <VideoThumbnail key={post.id} post={post} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome Completo</Label>
              <Input
                value={editForm.full_name}
                onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input
                value={editForm.username}
                onChange={e => setEditForm(p => ({ ...p, username: e.target.value.toLowerCase() }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Biografia</Label>
              <Textarea
                value={editForm.bio}
                onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Conte um pouco sobre você..."
                maxLength={160}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estilo de Humor Favorito</Label>
              <Select value={editForm.humor_style} onValueChange={v => setEditForm(p => ({ ...p, humor_style: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {HUMOR_STYLES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Followers/Following dialogs */}
      <UsersListDialog
        open={followersOpen}
        onClose={() => setFollowersOpen(false)}
        title="Seguidores"
        users={followers}
      />
      <UsersListDialog
        open={followingOpen}
        onClose={() => setFollowingOpen(false)}
        title="Seguindo"
        users={followingUsers}
      />
    </div>
  );
}

function VideoThumbnail({ post, index }: { post: PostWithProfile; index: number }) {
  const emojis = ["😂", "🤣", "😅", "😆", "🙃", "😏"];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group cursor-pointer hover:border-purple-600/40 transition-all"
    >
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-950/40 to-zinc-900">
        <div className="text-4xl">{emojis[index % emojis.length]}</div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-white text-xs font-medium line-clamp-2">{post.title}</p>
        <span className="text-zinc-300 text-xs">❤️ {formatCount(post.likes_count)}</span>
      </div>
    </motion.div>
  );
}

function UsersListDialog({ open, onClose, title, users }: {
  open: boolean;
  onClose: () => void;
  title: string;
  users: Profile[];
}) {
  const { setSelectedUserId, setActiveModule } = useApp();
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => {
                setSelectedUserId(user.id);
                setActiveModule("profile");
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/60 transition-all"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium text-zinc-200">{user.full_name}</p>
                <p className="text-sm text-zinc-500">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
