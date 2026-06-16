-- ============================================================================
-- MemeFlow Social Platform - Complete Supabase Schema
-- ============================================================================
-- This schema includes tables, RLS policies, indices, and realtime setup

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    humor_style TEXT,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Index on username for search
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles 
    FOR SELECT 
    USING (TRUE);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- ============================================================================
-- 2. POSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Indices on posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
    ON public.posts
    FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own posts"
    ON public.posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON public.posts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON public.posts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Enable RLS on likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Indices on likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes
    FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own likes"
    ON public.likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON public.likes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 4. COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Indices on comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments
    FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON public.comments
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON public.comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 5. FOLLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Indices on follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows
    FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own follows"
    ON public.follows
    FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
    ON public.follows
    FOR DELETE
    USING (auth.uid() = follower_id);

-- ============================================================================
-- 6. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CONVERSATION_PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Indices on conversation_participants
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id 
    ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id 
    ON public.conversation_participants(user_id);

-- Conversation participants policies
CREATE POLICY "Users can view their own conversation participants"
    ON public.conversation_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert into conversations they belong to"
    ON public.conversation_participants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

-- Conversations policies (created after conversation_participants table exists)
CREATE POLICY "Users can view conversations they participate in"
    ON public.conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = conversations.id AND user_id = auth.uid()
        )
    );

-- ============================================================================
-- 8. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Indices on messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Messages policies
CREATE POLICY "Users can view messages in conversations they participate in"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages into conversations they participate in"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 9. REALTIME PUBLICATIONS
-- ============================================================================
-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable Realtime for follows table
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- ============================================================================
-- 10. STORAGE BUCKETS
-- ============================================================================
-- Create storage buckets for media files

-- Create meme-videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meme-videos', 'meme-videos', FALSE)
ON CONFLICT DO NOTHING;

-- Create thumbnails bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', FALSE)
ON CONFLICT DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT DO NOTHING;

-- Create chat-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. STORAGE POLICIES
-- ============================================================================

-- meme-videos policies
CREATE POLICY "Allow authenticated users to upload meme videos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'meme-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to view meme videos they own"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'meme-videos');

-- thumbnails policies
CREATE POLICY "Allow authenticated users to upload thumbnails"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to view thumbnails"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'thumbnails');

-- avatars policies
CREATE POLICY "Allow authenticated users to upload avatars"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public to view avatars"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

-- chat-images policies
CREATE POLICY "Allow authenticated users to upload chat images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to view chat images in conversations they participate in"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'chat-images');

-- ============================================================================
-- 12. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 13. DATA CONSISTENCY FUNCTIONS
-- ============================================================================

-- Function to increment likes count on posts
CREATE OR REPLACE FUNCTION public.increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing likes
DROP TRIGGER IF EXISTS increment_likes_trigger ON public.likes;
CREATE TRIGGER increment_likes_trigger
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_post_likes();

-- Function to decrement likes count on posts
CREATE OR REPLACE FUNCTION public.decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing likes
DROP TRIGGER IF EXISTS decrement_likes_trigger ON public.likes;
CREATE TRIGGER decrement_likes_trigger
    AFTER DELETE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_post_likes();

-- Function to increment comments count on posts
CREATE OR REPLACE FUNCTION public.increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing comments
DROP TRIGGER IF EXISTS increment_comments_trigger ON public.comments;
CREATE TRIGGER increment_comments_trigger
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_post_comments();

-- Function to decrement comments count on posts
CREATE OR REPLACE FUNCTION public.decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing comments
DROP TRIGGER IF EXISTS decrement_comments_trigger ON public.comments;
CREATE TRIGGER decrement_comments_trigger
    AFTER DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_post_comments();

-- Function to increment followers count
CREATE OR REPLACE FUNCTION public.increment_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    
    UPDATE public.profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing followers
DROP TRIGGER IF EXISTS increment_followers_trigger ON public.follows;
CREATE TRIGGER increment_followers_trigger
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_followers_count();

-- Function to decrement followers count
CREATE OR REPLACE FUNCTION public.decrement_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
    
    UPDATE public.profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing followers
DROP TRIGGER IF EXISTS decrement_followers_trigger ON public.follows;
CREATE TRIGGER decrement_followers_trigger
    AFTER DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_followers_count();

-- Function to increment posts count
CREATE OR REPLACE FUNCTION public.increment_user_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET posts_count = posts_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for incrementing posts count
DROP TRIGGER IF EXISTS increment_posts_count_trigger ON public.posts;
CREATE TRIGGER increment_posts_count_trigger
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_user_posts_count();

-- Function to decrement posts count
CREATE OR REPLACE FUNCTION public.decrement_user_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET posts_count = GREATEST(0, posts_count - 1)
    WHERE id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for decrementing posts count
DROP TRIGGER IF EXISTS decrement_posts_count_trigger ON public.posts;
CREATE TRIGGER decrement_posts_count_trigger
    AFTER DELETE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_user_posts_count();

-- ============================================================================
-- End of Schema
-- ============================================================================
