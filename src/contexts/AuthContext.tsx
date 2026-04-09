import React, { createContext, useEffect, useState, type ReactNode } from "react";
import { auth, initDatabase } from "@/integrations/sqlite/client";

export interface AuthContextType {
  session: null;
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      await initDatabase();
      const { data } = await auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    if (data?.user) {
      auth.setUser(data.user);
      setUser(data.user);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await auth.signUp(email, password, fullName);
    if (data?.user) {
      auth.setUser(data.user);
      setUser(data.user);
    }
    return { error };
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session: null, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
