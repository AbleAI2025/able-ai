"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  ThumbsUp,
  MessageCircleCode,
  Award as AwardIconLucide,
  UserCircle,
} from "lucide-react";
import styles from "./page.module.css";
import WorkerProfile from "@/app/components/profile/WorkerProfile";
import CloseButton from "@/app/components/profile/CloseButton";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";

// Mock data for QA testing
const qaMockProfileData = {
  id: "benji-asamoah-id",
  displayName: "Benji Asamoah",
  userHandle: "@benjiasamoah",
  profileHeadline: "Expert Mixologist & Event Bartender",
  avatarUrl: "/images/avatar-benji.jpg",
  profileImageUrl: "/images/benji.jpeg",
  qrCodeUrl: "/images/qr.svg",
  location: "Streatham, London",
  isVerified: true,
  viewCalendarLink: "#view-calendar",

  statistics: [
    {
      id: "s1",
      icon: ThumbsUp,
      value: "100%",
      label: "Would work with Benji again",
    },
    {
      id: "s2",
      icon: MessageCircleCode,
      value: "100%",
      label: "Response rate",
    },
  ],
  skills: [
    { name: "Bartender", ableGigs: 15, experience: "3 years", eph: 15 },
    { name: "Waiter", ableGigs: 2, experience: "8 years", eph: 15 },
    { name: "Graphic Designer", ableGigs: 1, experience: "7 years", eph: 22 },
  ],
  awards: [
    { id: "a1", icon: AwardIconLucide, textLines: "Always on time" },
    { id: "a2", icon: UserCircle, textLines: "Able professional" },
  ],
  feedbackSummary: "Professional, charming and lively",
  qualifications: [
    "Bachelor's Degree in Graphic Design",
    "Licensed bar manager",
    "Drivers license",
  ],
  equipment: [
    "Camera gear",
    "Laptop",
    "Smartphone",
    "Uniform",
    "Bicycle",
    "Car",
  ],
};

// Mock data fetch for the worker's own profile
async function fetchWorkerOwnedProfile(userId: string, isViewQA: boolean) {
  if (isViewQA) {
    console.log("Using QA mock data for worker profile.");
    // Assign the correct userId from the route to the mock data
    return { ...qaMockProfileData, id: userId };
  }

  // --- REAL DATA FETCH LOGIC GOES HERE IN A REAL APPLICATION ---
  console.log("Attempting to fetch real worker profile for userId:", userId);
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate fetch delay

  // For now, still return mock data if isViewQA is false for demonstration
  // In a real app, you would fetch data based on userId here.
  return { ...qaMockProfileData, id: userId }; // Still returning mock for demo
}

export default function WorkerOwnedProfilePage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const userId = params.userId as string;
  const lastRoleUsed = getLastRoleUsed();

  const { user, loading: loadingAuth } = useAuth();

  const [profile, setProfile] = useState<PublicWorkerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSelfView = true;

  const handleAddSkill = () => {
    const newSkill = {
      name: "developer",
      ableGigs: 2,
      experience: "3 years",
      eph: 20,
    };
    if (profile) {
      setProfile({
        ...profile,
        id: profile.id || "",
        skills: [...(profile.skills || []), newSkill],
      });
    }
  };

  useEffect(() => {
    if (!loadingAuth && user) {
      if (
        lastRoleUsed === "GIG_WORKER" ||
        user.claims.role === "QA"
      ) {
        setLoadingProfile(true);
        fetchWorkerOwnedProfile(userId, user.claims.role === "QA")
          .then((data) => {
            setProfile(data);
            setError(null);
          })
          .catch((err) => {
            console.error("Failed to fetch worker profile:", err);
            setError("Could not load your profile.");
          })
          .finally(() => setLoadingProfile(false));
      } else {
        router.replace("/select-role");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth, user?.claims.role, userId, pathname, router, lastRoleUsed]);

  const handleSkillDetails = (name: string) => {
    return router.push(`/user/${userId}/worker/profile/skills/${name}`);
  };

  if (loadingAuth || loadingProfile) {
    return (
      <div className={styles.pageLoadingContainer}>
        {/* Using a generic Loader2 for now, ensure it's imported or replace with appropriate loader */}
        <UserCircle className="animate-spin" size={48} /> Loading Profile...
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.emptyState}>Profile not available.</p>
      </div>
    );
  }

  return (
    <div className={styles.profilePageContainer}>
      <CloseButton />
      <WorkerProfile
        workerProfile={profile}
        isSelfView={isSelfView}
        handleAddSkill={handleAddSkill}
        handleSkillDetails={handleSkillDetails}
      />
    </div>
  );
}
