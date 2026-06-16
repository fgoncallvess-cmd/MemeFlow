# Supabase Configuration - MemeFlow Social Platform

## Overview

This directory contains the Supabase database schema and configuration for the MemeFlow social platform.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Save your project URL and API keys (anon key)

### 2. Environment Variables

Create a `.env` file in the root of the project with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Initialize Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `schema.sql`
5. Run the query

This will create:
- All necessary tables with proper relationships
- Row Level Security (RLS) policies
- Triggers for data consistency
- Storage buckets for media files

### 4. Storage Bucket Configuration

The `schema.sql` automatically creates the following storage buckets:

- **meme-videos** - For user-uploaded video memes (private)
- **thumbnails** - For video thumbnails (private)
- **avatars** - For user profile pictures (public)
- **chat-images** - For chat message images (private)

#### Configure Bucket Policies

Storage policies are already created in `schema.sql`. You can verify them in:
Supabase Dashboard → Storage → Policies

### 5. Enable Realtime (Optional but Recommended)

Realtime is configured in `schema.sql` for:
- `messages` table - Real-time chat updates
- `follows` table - Real-time follower updates

To manually enable in Supabase:
1. Go to Supabase Dashboard
2. Navigate to **Replication** → **Publications**
3. Ensure `supabase_realtime` publication includes `messages` and `follows` tables

### 6. Verify Authentication

1. Go to **Authentication** → **Providers**
2. Enable desired providers (Email/Password is enabled by default)
3. Configure redirect URLs for your app

## Database Schema

### Tables

#### `profiles`
- User profile information
- Denormalized counters: followers_count, following_count, posts_count
- Connected to auth.users

#### `posts`
- User-generated meme videos
- Contains video_url, thumbnail_url, duration
- Denormalized counters: likes_count, comments_count

#### `likes`
- Post likes with unique constraint (user_id, post_id)
- Triggers auto-update posts.likes_count

#### `comments`
- Post comments
- Triggers auto-update posts.comments_count

#### `follows`
- User follow relationships
- Prevents self-follow with CHECK constraint
- Triggers auto-update profile counters

#### `conversations`
- Direct message conversations
- Participants managed in conversation_participants

#### `conversation_participants`
- Links users to conversations
- Unique constraint on (conversation_id, user_id)

#### `messages`
- Individual chat messages
- Supports text and images
- Realtime enabled

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

- **Profiles**: Public read, users can only edit their own
- **Posts**: Public read, users can CRUD only their own
- **Likes**: Public read, users can only create/delete their own
- **Comments**: Public read, users can CRUD only their own
- **Follows**: Public read, users can only create/delete their own
- **Messages**: Only conversation participants can read/write
- **Conversations**: Only participants can view

## Triggers & Functions

### Data Consistency Triggers

- `increment_post_likes` / `decrement_post_likes` - Keep posts.likes_count in sync
- `increment_post_comments` / `decrement_post_comments` - Keep posts.comments_count in sync
- `increment_followers_count` / `decrement_followers_count` - Keep profile counters in sync
- `increment_user_posts_count` / `decrement_user_posts_count` - Keep posts.posts_count in sync

### Timestamp Triggers

All tables have `update_updated_at_column()` triggers to automatically update the `updated_at` field.

## Indices

Performance indices are created on:
- `profiles(username)` - For profile searches
- `posts(user_id, created_at)` - For feed queries
- `likes(user_id, post_id)` - For like lookups
- `comments(post_id, created_at)` - For comment threads
- `follows(follower_id, following_id)` - For follow lookups
- `messages(conversation_id, created_at)` - For message history

## Testing the Setup

1. Create a test user via Supabase Auth
2. Insert a profile for that user
3. Test CRUD operations through your app
4. Verify RLS policies are working by attempting to access/modify other users' data

## Troubleshooting

### Common Issues

**Q: "No schema with OID" error**
- Ensure the schema.sql has been fully executed
- Check for any SQL syntax errors in the execution log

**Q: RLS policies blocking requests**
- Verify the user is authenticated
- Check that policies are correctly set for the operation (SELECT, INSERT, UPDATE, DELETE)
- Test with `service_role` key if debugging (never use in production)

**Q: Storage uploads failing**
- Verify the bucket exists in Storage section
- Check storage policies are properly configured
- Ensure the user is authenticated

**Q: Realtime not working**
- Verify the publication includes the table
- Check browser console for WebSocket connection errors
- Ensure the table has a primary key

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## Next Steps

1. Implement API functions in your client-side code
2. Create helper functions for common database operations
3. Add client-side type definitions based on your schema
4. Set up proper error handling and validation

