import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";
import { isEmbedRequired, analyzeVideoUrl } from "@/lib/videoUtils";

interface VideoPlayerProps {
  src: string;
  thumbnail?: string | null;
  className?: string;
}

export default function VideoPlayer({ src, thumbnail, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const [requiresEmbed, setRequiresEmbed] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string>();

  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });

  // Analyze video URL on mount
  useEffect(() => {
    const videoInfo = analyzeVideoUrl(src);
    setRequiresEmbed(videoInfo.isEmbed);
    setEmbedUrl(videoInfo.embedUrl);
  }, [src]);

  // Auto-play when in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [inView]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const pct = (video.currentTime / video.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    video.currentTime = pct * video.duration;
  };

  const showControlsTemp = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  const setRefs = (el: HTMLDivElement | null) => {
    inViewRef(el);
  };

  // If URL requires embed (YouTube, TikTok, etc), render iframe instead of video tag
  if (requiresEmbed && embedUrl) {
    return (
      <div
        ref={setRefs}
        className={cn("relative bg-black rounded-xl overflow-hidden", className)}
      >
        <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          {/* YouTube/TikTok embed */}
          {embedUrl.includes('youtube.com') && (
            <iframe
              src={embedUrl}
              title="YouTube video"
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          
          {/* TikTok embed */}
          {embedUrl.includes('tiktok.com') && (
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="encrypted-media"
              allowFullScreen
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setRefs}
      className={cn("relative bg-black rounded-xl overflow-hidden group cursor-pointer select-none", className)}
      onClick={togglePlay}
      onMouseMove={showControlsTemp}
      onTouchStart={showControlsTemp}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        poster={thumbnail || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-cover"
        style={{ maxHeight: "420px", minHeight: "200px" }}
      />

      {/* Play/Pause overlay */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
        (!playing || showControls) ? "opacity-100" : "opacity-0"
      )}>
        {!playing && (
          <div className="w-14 h-14 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity duration-200",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress bar */}
        <div
          className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="text-white hover:text-purple-300 transition-colors"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-purple-300 transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-white/70 text-xs">
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
