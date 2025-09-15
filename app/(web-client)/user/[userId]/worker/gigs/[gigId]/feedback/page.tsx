"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import FeedbackContainer from "@/app/components/gigs/FeedbackContainer";
import {
  BuyerFeedbackFormData,
  GigDetails,
  WorkerFeedbackFormData,
} from "@/app/types/GigFeedbackTypes";
import { useAuth } from "@/context/AuthContext";

async function getGigData(
  workerUserId: string,
  gigId: string
): Promise<GigDetails | null> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    id: gigId,
    role: "Bartender",
    workerName: "Benji Asamoah",
    workerAvatarUrl: "/images/benji.jpeg",
    workerId: workerUserId,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hourlyRate: 25,
    hoursWorked: 8,
    totalPayment: 200,
    duration: "4 hours",
    details:
      "Completed gig on Monday, 9:00 am. Location: Central Train station",
    earnings: 80.0,
  };
}

export default function WorkerFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const gigId = params.gigId as string;

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;
  const [gigData, setGigData] = useState<GigDetails | null>(null);
  const [isLoadingGig, setIsLoadingGig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loadingAuth) return;
    const shouldFetch =
      (user?.claims.role === "QA" && gigId) ||
      (user && authUserId === pageUserId && gigId);
    if (shouldFetch) {
      setIsLoadingGig(true);
      getGigData(authUserId!, gigId)
        .then((data) => {
          if (data) {
            setGigData(data);
          } else {
            setError(
              "Gig not found, not ready for feedback, or feedback already submitted."
            );
            router.push(`/user/${user?.uid}/worker`);
          }
        })
        .catch(() => {
          setError("Could not load gig information for feedback.");
        })
        .finally(() => setIsLoadingGig(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth, authUserId, pageUserId, gigId]);

  const handleSubmit = (
    data: WorkerFeedbackFormData | BuyerFeedbackFormData
  ) => {
    const workerData = data as WorkerFeedbackFormData;
    setError(null);
    setSuccessMessage(null);
    if (workerData.wouldWorkAgain === null) {
      setError("Please indicate if you would work with this buyer again.");
      return;
    }
    if (!gigData || !user?.uid) {
      setError("Gig information or user ID is missing.");
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSuccessMessage(
        `Feedback for ${gigData.workerName} submitted successfully!`
      );
      setIsSubmitting(false);
    }, 1200);
  };

  if (loadingAuth || isLoadingGig) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin" size={32} /> Loading...
      </div>
    );
  }
  if (error && (!gigData || !user?.uid) && !successMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <h1 className="text-xl font-semibold mb-2">Feedback Error</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  if (!gigData && !successMessage && user?.uid) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <h1 className="text-xl font-semibold mb-2">Feedback Not Available</h1>
        <p className="text-gray-600">
          Gig information not available for feedback.
        </p>
      </div>
    );
  }
  if (successMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <h1 className="text-xl font-semibold mb-2">Feedback Submitted</h1>
        <p className="text-green-600">{successMessage}</p>
      </div>
    );
  }
  return (
    <FeedbackContainer
      gigData={gigData}
      user={user}
      role="GIG_WORKER"
      mode="worker"
      onSubmit={handleSubmit}
      loading={isSubmitting}
      error={error}
      successMessage={successMessage}
      handleBack={() => router.back()}
    />
  );
}
