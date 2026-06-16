import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("📍 fetchProfile: Starting for userId:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      console.log("📍 Query result:", { data, error });
      
      // Check if profile exists in response
      if (!error && data) {
        console.log("✅ Profile found:", data);
        setProfile(data as unknown as Profile);
        return;
      }
      
      // If profile doesn't exist (PGRST116), create a default one
      if (error?.code === "PGRST116") {
        console.warn("⚠️ Profile not found for user", userId, "- creating default profile");
        
        // Get user info from auth and derive a sensible default name/username
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const userEmail = authUser?.email || `user_${userId.slice(0, 8)}@memeflow.local`;

        // Prefer any provided user metadata name, otherwise derive from email local-part
        const nameFromMetadata = (authUser as any)?.user_metadata?.full_name || (authUser as any)?.user_metadata?.name || null;
        let derivedName = nameFromMetadata || null;
        if (!derivedName && userEmail) {
          const local = userEmail.split("@")[0] || `user_${userId.slice(0, 8)}`;
          derivedName = local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        }

        // Derive a reasonable username from metadata or email local-part
        const usernameFromMeta = (authUser as any)?.user_metadata?.username || null;
        const derivedUsername = usernameFromMeta || (userEmail ? userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_") : `user_${userId.slice(0, 8)}`);

        const defaultProfile = {
          id: userId,
          username: derivedUsername,
          email: userEmail,
          full_name: derivedName || "Usuário",
          avatar_url: null,
          bio: "",
          // humor_style: null, // Comentado até migration ser feita
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        try {
          const { data: created, error: insertError } = await supabase
            .from("profiles")
            .insert([defaultProfile])
            .select()
            .single();
          
          if (!insertError && created) {
            console.log("✅ Default profile created:", created);
            setProfile(created as unknown as Profile);
            return;
          }
        } catch (insertErr) {
          console.error("❌ Exception creating default profile:", insertErr);
        }
        
        // If creation failed, set local profile
        setProfile(defaultProfile as unknown as Profile);
        return;
      }
      
      // Other query errors
      if (error) {
        console.error("❌ Query error:", error);
        setProfile(null);
        return;
      }
      
      // Unexpected state
      setProfile(null);
    } catch (err) {
      console.error("❌ Unexpected error in fetchProfile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 signIn: Attempting login for", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("❌ Login error:", error);
        return { error: error as Error };
      }
      
      if (data.user) {
        console.log("✅ Login successful, fetching profile...");
        await fetchProfile(data.user.id);
      }
      
      return { error: null };
    } catch (e) {
      console.error("❌ Login exception:", e);
      return { error: e as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      console.log("📝 signUp: Creating account for", email, username);
      // Validate inputs: username and fullName must be provided
      if (!username || username.trim().length === 0) {
        return { error: new Error("Username é obrigatório") };
      }
      if (!fullName || fullName.trim().length === 0) {
        return { error: new Error("Nome completo é obrigatório") };
      }

      // Ensure username is unique before signup profile creation
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .limit(1)
          .maybeSingle();

        if (existing) {
          return { error: new Error("Username já está em uso") };
        }
      } catch (e) {
        // ignore lookup errors and proceed, DB will enforce uniqueness
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("❌ Signup error:", error);
        return { error: error as Error };
      }

      if (data.user) {
        const profileData = {
          id: data.user.id,
          username,
          email,
          full_name: fullName,
          avatar_url: null,
          bio: "Bem-vindo ao MemeFlow! 😂",
          // humor_style: "Nonsense", // Comentado até migration ser feita
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log("📤 Creating profile:", profileData);
        const { data: createdProfile, error: profileError } = await supabase
          .from("profiles")
          .insert([profileData])
          .select();

        if (profileError) {
          console.error("❌ Profile creation error:", profileError);
          return { error: profileError as Error };
        } else if (createdProfile && createdProfile.length > 0) {
          console.log("✅ Profile created:", createdProfile[0]);
          setProfile(createdProfile[0] as unknown as Profile);
        }
      }
      return { error: null };
    } catch (e) {
      console.error("❌ Signup exception:", e);
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error as Error | null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };
    try {
      // Only include fields that can be updated
      const { id, created_at, followers_count, following_count, posts_count, ...updatePayload } = updates as any;
      
      // Remove humor_style if it doesn't exist in the database yet
      const { humor_style, ...safePayload } = updatePayload;
      
      const payload = { ...safePayload, updated_at: new Date().toISOString() };
      
      console.log("📤 Updating profile with payload:", payload);
      
      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating profile:", error);
        return { error: error as Error };
      }

      if (data) {
        console.log("✅ Profile updated:", data);
        setProfile(data as unknown as Profile);
      }

      return { error: null };
    } catch (e) {
      console.error("❌ Exception in updateProfile:", e);
      return { error: e as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, resetPassword, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
