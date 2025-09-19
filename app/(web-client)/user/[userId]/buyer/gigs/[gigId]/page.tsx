"use client";

import React, { useEffect, useState } from "react";
import { useAuth, User } from "@/context/AuthContext";
import { useParams } from "next/navigation"; // Added useParams
import GigDetailsComponent from "@/app/components/gigs/GigDetails";
import type GigDetails from "@/app/types/GigDetailsTypes"; // Assuming you have this type defined
import { getGigDetails } from "@/actions/gigs/get-gig-details";

// Add spinner animation styles
const spinnerStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

async function fetchBuyerGigDetails(user: User, gigId: string): Promise<GigDetails | null> {

  const isViewQA = false;
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

  return (
    <>
      <style>{spinnerStyles}</style>
      {isLoadingGig && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#1A1A1A',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                border: '4px solid #ffffff', 
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        </div>
      )}
      
      {!isLoadingGig && notFound && <div>Gig not found or unavailable.</div>}
      
      {!isLoadingGig && !notFound && gig && (
        <GigDetailsComponent userId={pageUserId} role="buyer" gig={gig} setGig={setGig} />
      )}
    </>
  );
}
