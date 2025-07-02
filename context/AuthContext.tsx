"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  getIdTokenResult,
  IdTokenResult,
  User as FirebaseUser,
} from "firebase/auth";
import { authClient } from "@/lib/firebase/clientApp";

type Claims = {
  role: string;
};

export type User = FirebaseUser & {
  token: string;
  claims: Claims;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

const MAX_POLLING_ATTEMPTS = 10;
const POLLING_INTERVAL_MS = 1000;

async function fetchTokenResultWithPolling(
  user: FirebaseUser
): Promise<IdTokenResult | null> {
  for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
    const tokenResult = await getIdTokenResult(user, true);

    if (tokenResult.claims?.role) {
      return tokenResult;
    }

    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
  }

  return null;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log(user);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authClient, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await fetchTokenResultWithPolling(firebaseUser);
        if (tokenResult) {
          const enrichedUser = Object.assign(firebaseUser, {
            token: tokenResult.token,
            claims: tokenResult.claims as Claims,
          });
          setUser(enrichedUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
