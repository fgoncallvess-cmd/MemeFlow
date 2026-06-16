/**
 * Utility functions for handling external video URLs
 * Supports YouTube, YouTube Shorts, TikTok, and direct video files
 */

export type VideoType = 'youtube' | 'youtube-shorts' | 'tiktok' | 'direct' | 'unknown';

export interface VideoInfo {
  type: VideoType;
  embedUrl?: string;
  isEmbed: boolean;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYoutubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=ID
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const id = urlObj.searchParams.get('v');
      if (id) return id;
    }
    
    // youtu.be/ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    // youtube.com/shorts/ID
    if (urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1].split('?')[0];
    }
  } catch (e) {
    // If URL parsing fails, try regex
    const regexes = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const regex of regexes) {
      const match = url.match(regex);
      if (match) return match[1];
    }
  }
  
  return null;
}

/**
 * Extract TikTok video ID from various TikTok URL formats
 */
function extractTikTokId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // tiktok.com/@username/video/ID
    const match = urlObj.pathname.match(/\/video\/(\d+)/);
    if (match) return match[1];
  } catch (e) {
    // Fallback regex
    const match = url.match(/\/video\/(\d+)/);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Determine the type of video URL and convert to appropriate embed format
 */
export function analyzeVideoUrl(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', isEmbed: false };
  }
  
  const lowerUrl = url.toLowerCase().trim();
  
  // Check for direct video files
  if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.avi')) {
    return {
      type: 'direct',
      isEmbed: false
    };
  }
  
  // Check for Supabase Storage URLs (direct video files)
  if (lowerUrl.includes('supabase') || lowerUrl.includes('storage')) {
    return {
      type: 'direct',
      isEmbed: false
    };
  }
  
  // Check for YouTube Shorts
  if (lowerUrl.includes('youtube.com/shorts/') || lowerUrl.includes('youtu.be/')) {
    const videoId = extractYoutubeId(url);
    if (videoId) {
      return {
        type: 'youtube-shorts',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`,
        isEmbed: true
      };
    }
  }
  
  // Check for YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    const videoId = extractYoutubeId(url);
    if (videoId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`,
        isEmbed: true
      };
    }
  }
  
  // Check for TikTok
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok.com') || lowerUrl.includes('vt.tiktok.com')) {
    const videoId = extractTikTokId(url);
    if (videoId) {
      return {
        type: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        isEmbed: true
      };
    }
  }
  
  // If nothing matched, assume it's a direct URL
  return {
    type: 'direct',
    isEmbed: false
  };
}

/**
 * Get the appropriate embed URL for a video
 */
export function getEmbedUrl(url: string): string {
  const info = analyzeVideoUrl(url);
  return info.embedUrl || url;
}

/**
 * Check if a URL requires an iframe embed
 */
export function isEmbedRequired(url: string): boolean {
  const info = analyzeVideoUrl(url);
  return info.isEmbed;
}

/**
 * Check if a URL is a valid video URL
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  
  const info = analyzeVideoUrl(url);
  return info.type !== 'unknown';
}
