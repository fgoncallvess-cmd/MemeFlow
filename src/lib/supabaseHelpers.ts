/**
 * Supabase Helper Functions
 * Common database operations for MemeFlow Social Platform
 */

import { supabase } from "./supabase";
import {
  Profile,
  Post,
  Like,
  Comment,
  Follow,
  Message,
  Conversation,
  ConversationParticipant,
  PostInsert,
  CommentInsert,
  MessageInsert,
} from "../types/database";

// ============================================================================
// PROFILE FUNCTIONS
// ============================================================================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) console.error("Error fetching profile:", error);
  return data;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) console.error("Error fetching profile by username:", error);
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) console.error("Error updating profile:", error);
  return data;
}

// ============================================================================
// POST FUNCTIONS
// ============================================================================

export async function getFeedPosts(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles:user_id (id, username, avatar_url, full_name)
    `
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) console.error("Error fetching feed posts:", error);
  return data;
}

export async function getUserPosts(userId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles:user_id (id, username, avatar_url, full_name)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) console.error("Error fetching user posts:", error);
  return data;
}

export async function createPost(post: PostInsert) {
  const { data, error } = await supabase
    .from("posts")
    .insert([post])
    .select()
    .single();

  if (error) console.error("Error creating post:", error);
  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) console.error("Error deleting post:", error);
  return !error;
}

// ============================================================================
// LIKE FUNCTIONS
// ============================================================================

export async function likePost(userId: string, postId: string) {
  const { data, error } = await supabase
    .from("likes")
    .insert([{ user_id: userId, post_id: postId }])
    .select()
    .single();

  if (error) console.error("Error liking post:", error);
  return data;
}

export async function unlikePost(userId: string, postId: string) {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (error) console.error("Error unliking post:", error);
  return !error;
}

export async function checkIfPostLiked(userId: string, postId: string) {
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .single();

  return !!data;
}

// ============================================================================
// COMMENT FUNCTIONS
// ============================================================================

export async function getPostComments(postId: string, limit = 20) {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles:user_id (id, username, avatar_url, full_name)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) console.error("Error fetching comments:", error);
  return data;
}

export async function createComment(comment: CommentInsert) {
  const { data, error } = await supabase
    .from("comments")
    .insert([comment])
    .select()
    .single();

  if (error) console.error("Error creating comment:", error);
  return data;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) console.error("Error deleting comment:", error);
  return !error;
}

// ============================================================================
// FOLLOW FUNCTIONS
// ============================================================================

export async function followUser(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from("follows")
    .insert([{ follower_id: followerId, following_id: followingId }])
    .select()
    .single();

  if (error) console.error("Error following user:", error);
  return data;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) console.error("Error unfollowing user:", error);
  return !error;
}

export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, profiles:follower_id(*)")
    .eq("following_id", userId);

  if (error) console.error("Error fetching followers:", error);
  return data;
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id, profiles:following_id(*)")
    .eq("follower_id", userId);

  if (error) console.error("Error fetching following:", error);
  return data;
}

export async function checkIfFollowing(
  followerId: string,
  followingId: string
) {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  return !!data;
}

// ============================================================================
// MESSAGE & CONVERSATION FUNCTIONS
// ============================================================================

export async function createConversation(participantIds: string[]) {
  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert([{}])
    .select()
    .single();

  if (convError) {
    console.error("Error creating conversation:", convError);
    return null;
  }

  // Add participants
  const participants = participantIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
  }));

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participants);

  if (partError) {
    console.error("Error adding participants:", partError);
    return null;
  }

  return conversation;
}

export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `
      conversation_id,
      conversations (
        id,
        created_at,
        updated_at,
        conversation_participants (
          user_id,
          profiles:user_id (id, username, avatar_url, full_name)
        ),
        messages (id, content, created_at, user_id, profiles:user_id (username))
      )
    `
    )
    .eq("user_id", userId)
    .order("conversations.updated_at", { ascending: false });

  if (error) console.error("Error fetching conversations:", error);
  return data;
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      profiles:user_id (id, username, avatar_url)
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) console.error("Error fetching messages:", error);
  return data?.reverse();
}

export async function sendMessage(message: MessageInsert) {
  const { data, error } = await supabase
    .from("messages")
    .insert([message])
    .select()
    .single();

  if (error) console.error("Error sending message:", error);
  return data;
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase.from("messages").delete().eq("id", messageId);

  if (error) console.error("Error deleting message:", error);
  return !error;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

export async function searchUsers(query: string, limit = 10) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", `%${query}%`)
    .limit(limit);

  if (error) console.error("Error searching users:", error);
  return data;
}

export async function searchPosts(query: string, limit = 20) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles:user_id (id, username, avatar_url)
    `
    )
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) console.error("Error searching posts:", error);
  return data;
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

export async function uploadVideo(
  file: File,
  userId: string,
  bucket: "meme-videos" = "meme-videos"
) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading video:", error);
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

export async function uploadThumbnail(
  file: File,
  userId: string,
  bucket: "thumbnails" = "thumbnails"
) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading thumbnail:", error);
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

export async function uploadAvatar(
  file: File,
  userId: string,
  bucket: "avatars" = "avatars"
) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error("Error uploading avatar:", error);
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

export async function uploadChatImage(
  file: File,
  userId: string,
  bucket: "chat-images" = "chat-images"
) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading chat image:", error);
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload.new) {
          onMessage(payload.new as Message);
        }
      }
    )
    .subscribe();

  return subscription;
}

export function subscribeToFollows(
  userId: string,
  onFollow: (follow: Follow) => void
) {
  const subscription = supabase
    .channel(`follows:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "follows",
        filter: `following_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onFollow(payload.new as Follow);
        }
      }
    )
    .subscribe();

  return subscription;
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export function handleSupabaseError(error: any) {
  console.error("Supabase error:", error);
  return {
    message: error?.message || "An error occurred",
    code: error?.code,
  };
}
