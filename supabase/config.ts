/**
 * Supabase Configuration
 * Central configuration for Supabase client and environment variables
 */

export const supabaseConfig = {
  // Environment variables
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Storage buckets
  storage: {
    memeVideos: 'meme-videos',
    thumbnails: 'thumbnails',
    avatars: 'avatars',
    chatImages: 'chat-images',
  },
  
  // Tables
  tables: {
    profiles: 'profiles',
    posts: 'posts',
    likes: 'likes',
    comments: 'comments',
    follows: 'follows',
    conversations: 'conversations',
    conversationParticipants: 'conversation_participants',
    messages: 'messages',
  },
  
  // Realtime channels
  realtime: {
    messages: 'messages',
    follows: 'follows',
  },
};

export default supabaseConfig;
