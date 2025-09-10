"use client"
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./loading.module.css";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.claims.role) {
      router.push("/");
    }
  }, [loading, user?.claims]);

  if (loading || !user) {
    return (
      <div className={styles.container}>
        <Image
          src="/images/ableai.png"
          alt="Loading Logo"
          width={180}
          height={180}
          className={styles.pulse}
          priority
        />
      </div>
    );
  }

  return <>{children}</>;
};
