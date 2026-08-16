import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import { saasApi, type MeResponse, type Permissions } from "./saas-api";

type AuthState = {
  ready: boolean;
  session: Session | null;
  me: MeResponse | null;
  permissions: Permissions | null;
  /** demo = public sample API; workspace = SaaS /api/v1 */
  mode: "demo" | "workspace";
  setMode: (m: "demo" | "workspace") => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  accessToken: string | null;
  supabaseReady: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [mode, setMode] = useState<"demo" | "workspace">("demo");

  const refreshMe = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setMe(null);
      return;
    }
    try {
      const profile = await saasApi.me(token);
      setMe(profile);
    } catch {
      setMe(null);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) setMode("workspace");
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setMode("workspace");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      void refreshMe();
    } else {
      setMe(null);
    }
  }, [session?.access_token, refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured for this build.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setMode("workspace");
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured for this build.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) {
      setMode("workspace");
      return null;
    }
    return "Check your email to confirm, then sign in.";
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setMe(null);
    setMode("demo");
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      me,
      permissions: me?.permissions || null,
      mode,
      setMode,
      signIn,
      signUp,
      signOut,
      refreshMe,
      accessToken: session?.access_token || null,
      supabaseReady: isSupabaseConfigured(),
    }),
    [ready, session, me, mode, signIn, signUp, signOut, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
