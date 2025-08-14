"use client";

import React, { useEffect, useState } from "react";
import { useAuth, User } from "@/context/AuthContext";
import { useParams } from "next/navigation"; // Added useParams
import GigDetailsComponent from "@/app/components/gigs/GigDetails";
import type GigDetails from "@/app/types/GigDetailsTypes"; // Assuming you have this type defined
import { getGigDetails } from "@/actions/gigs/get-gig-details";

async function fetchBuyerGigDetails(user: User, gigId: string): Promise<GigDetails | null> {
  console.log("Fetching gig details for buyer:", user?.uid, "gig:", gigId);

  // Force QA mock mode so any gigId returns mock during integration
  const isViewQA = true;
  const { gig, status } = await getGigDetails({ gigId, userId: user?.uid, role: 'buyer', isViewQA });

  if (!gig || status !== 200) return null;

  return gig;
}

export default function BuyerGigDetailsPage() {
  const params = useParams();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const gigId = params.gigId as string;
  const [isLoadingGig, setIsLoadingGig] = useState(false);
  const [gig, setGig] = useState<GigDetails | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loadingAuth || !authUserId) return; // Wait for auth state to be clear

    const shouldFetch = (pageUserId && gigId);

    if (shouldFetch) {
      setIsLoadingGig(true);
      fetchBuyerGigDetails(user as User, gigId)
        .then(data => {
          if (data) {
            setGig(data);
          } else {
            setNotFound(true);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch buyer gig details:', err);
          setNotFound(true);
        })
        .finally(() => {
          setIsLoadingGig(false);
        });
    }
  }, [loadingAuth, user, authUserId, pageUserId, gigId, setIsLoadingGig]);

  if (isLoadingGig) {
    return <div>Loading gig details...</div>;
  }

  if (notFound || !gig) {
    return <div>Gig not found or unavailable.</div>;
  }

  return (
    <GigDetailsComponent userId={pageUserId} role="buyer" gig={gig} setGig={setGig} />
  );
}
