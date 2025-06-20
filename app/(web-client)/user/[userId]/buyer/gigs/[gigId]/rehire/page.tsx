"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout"; // Reusing
import MessageBubble from "@/app/components/onboarding/MessageBubble"; // Reusing
import RehireWorkerCard from "@/app/components/buyer/RehireWorkerCard"; // New specific card
import { Home, Loader2 } from "lucide-react";

import styles from "./RehirePage.module.css"; // Create this CSS Module
import { useAuth } from "@/context/AuthContext";

const BOT_AVATAR_SRC = "/images/logo-placeholder.svg"; // Your bot avatar

interface OriginalGigInfo {
  // For Able's initial message
  workerName: string;
  role: string;
  originalDate: string;
  originalLocation: string;
}
interface RehireWorkerData {
  // For the card
  workerId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  ableGigs: number;
  experienceYears: string | number;
  reviewKeywords: string[];
  proposedHourlyRate: number;
  proposedHours: number; // This will be key
  platformFeePercent: number; // Example: 6.5
  paymentProviderFeeFixed: number; // Example: 0.20
  paymentProviderFeePercent: number; // Example: 0.015 (1.5%)
}

// Mock function to fetch data needed for rehire screen
async function fetchRehireData(
  buyerUserId: string,
  gigId: string
): Promise<{
  originalGig: OriginalGigInfo;
  workerForRehire: RehireWorkerData;
} | null> {
  console.log("Fetching rehire data for buyer:", buyerUserId, "gigId:", gigId);
  // API Call: GET /api/gigs/${gigId}/prepare-rehire
  // Backend fetches originalGig details and worker details.
  // It also checks worker's *current* general availability (not specific slot yet).
  await new Promise((resolve) => setTimeout(resolve, 700));

  // Example Data
  if (gigId === "pastGig123") {
    return {
      originalGig: {
        workerName: "Jerimiah Jones",
        role: "Bartender",
        originalDate: "last Tuesday",
        originalLocation: "Central Station",
      },
      workerForRehire: {
        workerId: "jerimiah-jones-id",
        name: "Jerimiah Jones",
        avatarUrl: "/images/avatar-jerimiah.jpg",
        role: "Bartender",
        ableGigs: 15,
        experienceYears: "3+",
        reviewKeywords: ["lively", "professional", "hardworking"],
        proposedHourlyRate: 15,
        proposedHours: 4, // Default from image, can be edited
        platformFeePercent: 6.5,
        paymentProviderFeeFixed: 0.2,
        paymentProviderFeePercent: 1.5,
      },
    };
  }
  return null;
}

export default function RehirePage() {
  const params = useParams();
  const gigId = params.gigId as string;

  const { user, loading: loadingAuth } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [originalGigInfo, setOriginalGigInfo] =
    useState<OriginalGigInfo | null>(null);
  const [workerToRehire, setWorkerToRehire] = useState<RehireWorkerData | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat messages state
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: number;
      type: "bot" | "userAction";
      content: string | React.ReactNode;
    }>
  >([]);

  // Fetch initial data
  useEffect(() => {
    if (user && user?.uid && gigId) {
      setIsLoadingData(true);
      fetchRehireData(user.uid, gigId)
        .then((data) => {
          if (data) {
            setOriginalGigInfo(data.originalGig);
            setWorkerToRehire(data.workerForRehire);
            // Initialize chat messages
            setChatMessages([
              {
                id: 1,
                type: "bot",
                content: `Awesome, you want to rehire ${data.originalGig.workerName} for a ${data.originalGig.role} shift, similar to your gig on ${data.originalGig.originalDate} at ${data.originalGig.originalLocation}? (Proposing a 4 hour shift for next Friday at 6pm - you can edit this.)`,
              },
              {
                id: 2,
                type: "bot",
                content: `Perfect, ${data.originalGig.workerName} is generally available. Click the card to edit details or book them now!`,
              },
            ]);
          } else {
            setError("Could not load details for rehire.");
          }
        })
        .catch(() => setError("Error loading rehire information."))
        .finally(() => setIsLoadingData(false));
    }
  }, [user, user?.uid, gigId]);

  // Scroll to bottom for chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleEditDetails = () => {
    if (!workerToRehire) return;
    console.log("Editing rehire details for:", workerToRehire.name);
    // Navigate to a simplified gig edit form, pre-filled with current workerToRehire data
    // e.g., router.push(`/user/${authUserId}/buyer/gigs/edit-rehire?workerId=${workerToRehire.workerId}&hours=${workerToRehire.proposedHours}&rate=${workerToRehire.proposedHourlyRate}&date=...`);
    // For now, just an alert or update state if modal
    alert(
      "Gig detail editing form would open here. You'd adjust proposed date, time, hours."
    );
    // Example of updating locally for demo:
    // const newHours = prompt("Enter new hours:", workerToRehire.proposedHours.toString());
    // if (newHours && !isNaN(parseFloat(newHours))) {
    //   setWorkerToRehire(prev => prev ? {...prev, proposedHours: parseFloat(newHours)} : null);
    // }
  };

  const handleBookWorker = async () => {
    if (!workerToRehire || !originalGigInfo) return;
    setIsBooking(true);
    setError(null);

    const bookingPayload = {
      buyerUserId: user?.uid, // Corrected user.uid
      workerId: workerToRehire.workerId,
      role: workerToRehire.role,
      // These would come from an edit step or defaults:
      proposedDate: "Next Friday", // Needs a real date picker in edit flow
      proposedStartTime: "18:00", // Needs a real time picker
      proposedHours: workerToRehire.proposedHours,
      proposedRate: workerToRehire.proposedHourlyRate,
      location: originalGigInfo.originalLocation, // Or editable
      // Add other necessary fields from originalGigInfo or an edit form
    };
    console.log("Booking worker with payload:", bookingPayload);

    try {
      // API Call: POST /api/gigs/rehire (or a specific create gig endpoint for rehires)
      // Backend creates a new Gig record, links to worker, notifies worker.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // const response = await fetch('/api/gigs/rehire', { method: 'POST', body: JSON.stringify(bookingPayload), headers: {'Content-Type': 'application/json'} });
      // if (!response.ok) throw new Error((await response.json()).message || "Failed to book worker.");
      // const newGig = await response.json();

      // Add confirmation message to chat
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: `Great! ${workerToRehire.name} has been booked for the new gig. Details are in your calendar.`,
        },
      ]);
      // router.push(`/user/${newGig.id}`); // Navigate to new gig details
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now(), type: "bot", content: `Error: ${err.message}` },
        ]);
      } else {
        setError("An unknown error occurred while booking the worker.");
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now(), type: "bot", content: "Error: An unknown error occurred." },
        ]);
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (loadingAuth || isLoadingData) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={32} /> Loading Rehire
        Information...
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }
  if (!originalGigInfo || !workerToRehire) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.emptyState}>
            Information for rehire not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ChatBotLayout ref={chatContainerRef}>
        {" "}
        {/* Pass ref if ChatBotLayout handles scrolling */}
        {chatMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            text={msg.content as string}
            senderType={msg.type as "bot" | "user"} // Assuming 'userAction' type won't render via MessageBubble directly
            avatarSrc={BOT_AVATAR_SRC}
            showAvatar={msg.type === "bot"}
          />
        ))}
        {/* Worker Card for Rehire */}
        {workerToRehire && (
          <div className={styles.rehireCardContainer}>
            <RehireWorkerCard
              workerData={workerToRehire}
              onEdit={handleEditDetails}
              onBook={handleBookWorker}
              isBooking={isBooking}
            />
          </div>
        )}
        {/* Error message bubble if API call fails during booking */}
        {error && !isBooking && (
          <MessageBubble
            text={`Oops! ${error}`}
            senderType="bot"
            avatarSrc={BOT_AVATAR_SRC}
          />
        )}
      </ChatBotLayout>
      <footer className={styles.footerNav}>
        <Link href={`/user/${user?.uid || "this_user"}/buyer`} passHref>
          <button className={styles.homeButtonNav} aria-label="Go to Home">
            <Home size={24} />
          </button>
        </Link>
      </footer>
    </div>
  );
}
