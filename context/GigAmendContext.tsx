"use client";

import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import type GigDetails from '@/app/types/GigDetailsTypes';

interface GigContextType {
  gig: GigDetails | null;
  setGig: Dispatch<SetStateAction<GigDetails | null>>;
  isLoading: boolean;
  error: string | null;
}

export const GigAmendContext = createContext<GigContextType | undefined>(undefined);

export function useGigAmendContext() {
  const context = useContext(GigAmendContext);
  if (context === undefined) {
    throw new Error('useGigContext must be used within a GigContextProvider');
  }
  return context;
}
