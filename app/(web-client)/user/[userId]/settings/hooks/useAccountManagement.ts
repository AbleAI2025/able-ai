"use client";

import { useState } from "react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteUserAccountAction } from "@/actions/user/user";
import { authClient } from "@/lib/firebase/clientApp";
import { User } from "@/context/AuthContext";

export const useAccountManagement = (user: User | null) => {
  const router = useRouter();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccountConfirmed = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteUserAccountAction(user?.token);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete account.");
      }

      toast.success("Account deleted successfully. Redirecting...");

      // On success, logout and redirect
      if (authClient) {
        await firebaseSignOut(authClient);
        router.push("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to delete account.");
      } else {
        toast.error("Failed to delete account.");
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false);
    }
  };

  return {
    showDeleteAccountModal,
    setShowDeleteAccountModal,
    isDeletingAccount,
    handleDeleteAccountConfirmed,
  };
};