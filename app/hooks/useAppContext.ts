// app/hooks/useAppContext.ts (example)
"use client";

import { User } from "firebase/auth";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { updateUserAppContext } from "@/app/actions/update-user-app-context";
import { useEffect, useState, useMemo } from "react";
import {
  getFirestoreUserByFirebaseUid,
  updateUserProfile,
} from "../lib/firebase/firestore";
import { getUserByFirebaseUid } from "../actions/userActions";

export interface ExtendedUser extends User {
  appRole?: "ADMIN" | "SUPER_ADMIN" | "QA" | "USER";
  lastRoleUsed?: "BUYER" | "GIG_WORKER";
  isBuyer?: boolean;
  isGigWorker?: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isQA: boolean;
  isBuyerMode: boolean; // Based on lastRoleUsed
  isWorkerMode: boolean; // Based on lastRoleUsed
  canBeBuyer: boolean; // User *can* be a buyer
  canBeGigWorker: boolean; // User *can* be a worker
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
}

interface AppContextValue {
  user: ExtendedUser | null;
  isLoading: boolean;
  updateUserContext: (updates: {
    lastRoleUsed?: "BUYER" | "GIG_WORKER";
    lastViewVisited?: string;
  }) => Promise<{ ok: boolean; error?: string | unknown }>;
}

export function useAppContext(): AppContextValue {
  const { user: firebaseUser, idToken } = useFirebaseAuth();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFirestoreUser = async (firebaseUser: User) => {
      const userData = await getFirestoreUserByFirebaseUid(firebaseUser?.uid);
      return userData;
    };
    const fetchUser = async (firebaseUser: User, idToken: string) => {
      const { value: userData, error } = await getUserByFirebaseUid(
        firebaseUser?.uid,
        idToken
      );
      if (error) {
        console.error("Error fetching user by firebaseUid:", error);
        return { ok: false, error: error };
      }
      return { ok: true, value: userData };
    };

    if (firebaseUser?.uid && idToken) {
      getFirestoreUser(firebaseUser)
        .then((firestoreUser) => {
          fetchUser(firebaseUser, idToken)
            .then(({ value: userData }) => {
              const lastRoleUsed =
                (localStorage.getItem("lastRoleUsed") as
                  | "BUYER"
                  | "GIG_WORKER"
                  | null) ||
                firestoreUser?.currentActiveRole ||
                userData?.appRole;
              const lastViewVisitedBuyer =
                (localStorage.getItem("lastViewVisitedBuyer") as
                  | string
                  | null) || userData?.lastViewVisitedBuyer;
              const lastViewVisitedWorker =
                (localStorage.getItem("lastViewVisitedWorker") as
                  | string
                  | null) || userData?.lastViewVisitedWorker;
              const isQA =
                localStorage.getItem("isViewQA") === "true" ||
                userData?.appRole === "QA";
              const extendedUser = {
                appRole: userData?.appRole,
                lastRoleUsed: userData?.lastRoleUsed,
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                isAuthenticated: true,
                isAdmin: userData?.appRole === "ADMIN",
                isSuperAdmin: userData?.appRole === "SUPER_ADMIN",
                isQA,
                isBuyerMode: lastRoleUsed === "BUYER",
                isWorkerMode: lastRoleUsed === "GIG_WORKER",
                canBeBuyer: userData?.isBuyer,
                canBeGigWorker: userData?.isGigWorker,
                lastViewVisitedBuyer,
                lastViewVisitedWorker,
              };
              setUser(extendedUser as ExtendedUser);
            })
            .catch((error) => {
              console.error("Error fetching user by firebaseUid:", error);
              setIsLoading(false);
            });
        })
        .catch((error) => {
          console.error("Error fetching firestore user by firebaseUid:", error);
          setIsLoading(false);
        });
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (user?.uid && user?.isAuthenticated) {
      setIsLoading(false);
    }
  }, [user?.uid, user?.isAuthenticated]);

  // Function to call API to update context in PG
  const updateUserContext = async (updates: {
    lastRoleUsed?: "BUYER" | "GIG_WORKER";
    lastViewVisited?: string;
  }) => {
    if (!user?.isAuthenticated || !idToken)
      return { ok: false, error: "Not authenticated" };

    try {
      if (user.lastRoleUsed === updates.lastRoleUsed) {
        if (
          updates.lastRoleUsed === "BUYER" &&
          user.lastViewVisitedBuyer === updates.lastViewVisited
        ) {
          return { ok: false, error: "Same view as before" };
        }
        if (
          updates.lastRoleUsed === "GIG_WORKER" &&
          user.lastViewVisitedWorker === updates.lastViewVisited
        ) {
          return { ok: false, error: "Same view as before" };
        }
      }
      // Call backend API to update PostgreSQL
      const { value: updatedPgData, error } = await updateUserAppContext(
        updates,
        idToken
      );

      await updateUserProfile(user?.uid, {
        currentActiveRole: updates.lastRoleUsed,
      });

      if (error) {
        console.error("Error updating user context:", error);
        return { ok: false, error };
      }

      // Update local storage for immediate client-side updates
      if (updatedPgData?.lastRoleUsed) {
        localStorage.setItem("lastRoleUsed", updatedPgData.lastRoleUsed);
      }
      if (updatedPgData?.lastViewVisitedBuyer) {
        localStorage.setItem(
          "lastViewVisitedBuyer",
          updatedPgData.lastViewVisitedBuyer
        );
      }
      if (updatedPgData?.lastViewVisitedWorker) {
        localStorage.setItem(
          "lastViewVisitedWorker",
          updatedPgData.lastViewVisitedWorker
        );
      }
      setUser(
        (prev) =>
          ({
            ...prev,
            appRole: updatedPgData?.appRole,
            lastRoleUsed: updatedPgData?.lastRoleUsed,
            isBuyer: updatedPgData?.isBuyer,
            isGigWorker: updatedPgData?.isGigWorker,
            lastViewVisitedBuyer: updatedPgData?.lastViewVisitedBuyer,
            lastViewVisitedWorker: updatedPgData?.lastViewVisitedWorker,
          } as ExtendedUser | null)
      );
      return { ok: true, error: undefined };
    } catch (error: unknown) {
      console.error("Error updating user context:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = String(error);
      }
      return { ok: false, error: errorMessage };
    }
  };

  // Add memoization for better performance
  const userValue = useMemo(() => ({
    user,
    isLoading,
    updateUserContext
  }), [user, isLoading]);

  return userValue;
}
