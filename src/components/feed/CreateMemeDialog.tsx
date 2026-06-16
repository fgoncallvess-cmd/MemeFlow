import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link, Video, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CATEGORIES } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import type { PostWithProfile } from "@/types/database";
import { createPost } from "@/lib/supabaseHelpers";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface CreateMemeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: PostWithProfile) => void;
}

type UploadMode = "upload" | "url";

export default function CreateMemeDialog({ open, onClose, onCreated }: CreateMemeDialogProps) {
  const { profile } = useAuth();
  const [uploadMode, setUploadMode] = useState<UploadMode>("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_DESC = 280;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "video/mp4" || file.type === "video/webm")) {
      setVideoFile(file);
      setUploadMode("upload");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title || !category) return;
    if (uploadMode === "url" && !videoUrl) return;
    if (uploadMode === "upload" && !videoFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 100);

      // Create post in Supabase
      const postData = {
        user_id: profile.id,
        title,
        description,
        video_url: uploadMode === "url" ? videoUrl : "https://www.w3schools.com/html/mov_bbb.mp4",
        thumbnail_url: null,
        duration: null,
      };

      const createdPost = await createPost(postData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (createdPost) {
        // Fetch the post with related profile data
        const { data: postWithProfile, error } = await supabase
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
            )
          `)
          .eq("id", createdPost.id)
          .single();

        if (!error && postWithProfile) {
          const newPost: PostWithProfile = {
            ...postWithProfile,
            profiles: postWithProfile.profiles,
            liked: false,
          };
          onCreated(newPost);
          handleReset();
        }
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Erro ao publicar o meme. Tente novamente.");
    } finally {
      setUploading(false);
      onClose();
    }
  };

  const handleReset = () => {
    setVideoUrl("");
    setVideoFile(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setHashtags("");
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !uploading) { handleReset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" />
            Publicar Meme
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload mode toggle */}
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setUploadMode("upload")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                uploadMode === "upload"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Upload className="w-4 h-4" />
              Upload de Vídeo
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                uploadMode === "url"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Link className="w-4 h-4" />
              Colar URL
            </button>
          </div>

          {/* Video input */}
          <AnimatePresence mode="wait">
            {uploadMode === "upload" ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    dragOver
                      ? "border-purple-500 bg-purple-900/20"
                      : videoFile
                        ? "border-green-500/50 bg-green-900/10"
                        : "border-zinc-700 hover:border-purple-600/50 hover:bg-zinc-800/30"
                  )}
                >
                  {videoFile ? (
                    <div>
                      <Video className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-zinc-200">{videoFile.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-zinc-300">Arraste ou clique para enviar</p>
                      <p className="text-xs text-zinc-500 mt-1">MP4, WebM • Máx. 100MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="space-y-1.5">
                  <Label>URL do Vídeo</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="https://youtube.com/shorts/... ou link direto .mp4"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      className="pl-9"
                      required={uploadMode === "url"}
                    />
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <p>✓ YouTube Shorts: youtube.com/shorts/ID</p>
                    <p>✓ YouTube normal: youtube.com/watch?v=ID ou youtu.be/ID</p>
                    <p>✓ TikTok: tiktok.com/@user/video/ID</p>
                    <p>✓ Direto: links .mp4, .webm (Supabase Storage ou URL pública)</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Dê um título épico pro seu meme..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="desc">Descrição</Label>
              <span className={cn(
                "text-xs",
                description.length > MAX_DESC * 0.9 ? "text-red-400" : "text-zinc-500"
              )}>
                {description.length}/{MAX_DESC}
              </span>
            </div>
            <Textarea
              id="desc"
              placeholder="Contextualize o meme, adicione humor extra..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={MAX_DESC}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <Label htmlFor="hashtags">Hashtags</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="hashtags"
                placeholder="trabalho sexta meme (sem #)"
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-zinc-500">Separe por espaços. Ex: trabalho sexta meme</p>
          </div>

          {/* Upload progress */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Publicando meme...</span>
                <span className="text-purple-400 font-medium">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </motion.div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { handleReset(); onClose(); }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={uploading || !title || !category || (uploadMode === "url" && !videoUrl) || (uploadMode === "upload" && !videoFile)}
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publicando...
                </div>
              ) : (
                "🚀 Publicar Meme"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
