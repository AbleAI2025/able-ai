'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import SkillSplashScreen from '@/app/components/profile/SkillSplashScreen';
import { Loader2, Star, Award, Zap } from 'lucide-react'; // Added Star, Award, Zap for mock icons
import styles from './EditableSkillPage.module.css';
import { useAuth } from '@/context/AuthContext';

// Define the structure of the skill profile data
interface SkillProfileData {
  id: string;
  name: string;
  title: string;
  hashtags: string;
  customerReviewsText: string;
  ableGigs: number;
  experienceYears: number;
  Eph: number;
  statistics: {
    reviews: number;
    paymentsCollected: string;
    tipsReceived: string;
  };
  supportingImages: string[];
  badges: {
    id: string | number;
    icon: React.ElementType; // Icon is a React component type
    textLines: string; // textLines is a single string
  }[];
  qualifications: string[];
  buyerReviews: {
    name: string;
    date: string;
    text: string;
  }[];
  recommendation?: {
    name: string;
    date: string;
    text: string;
  };
}

// Mock data for the skill profile
const mockSkillProfile: SkillProfileData = {
  id: '1',
  name: 'Benji Smith',
  title: 'Expert Graphic Designer & Illustrator',
  hashtags: '#GraphicDesign #Illustration #Branding #Art',
  customerReviewsText: '5.0 (120 reviews)',
  ableGigs: 250,
  experienceYears: 8,
  Eph: 75,
  statistics: {
    reviews: 120,
    paymentsCollected: '£45K',
    tipsReceived: '£2.5K',
  },
  supportingImages: [
    '/images/graphic-design-1.jpg',
    '/images/illustration-2.jpg',
    '/images/branding-project-3.jpg',
  ],
  badges: [
    { id: 1, icon: Star, textLines: 'Top Rated Seller' }, 
    { id: 2, icon: Award, textLines: '5 Years on Able' },
    { id: 3, icon: Zap, textLines: 'Quick Responder' },
  ],
  qualifications: [
    'Bachelor’s Degree in Graphic Design',
    'Adobe Certified Expert (ACE) - Illustrator',
    'Advanced Typography Course',
  ],
  buyerReviews: [
    {
      name: 'Alice Wonderland',
      date: '2024-03-15',
      text: 'Benji is an amazing designer! Delivered stunning visuals for my project ahead of schedule.',
    },
    {
      name: 'Bob The Builder',
      date: '2024-02-20',
      text: 'Top-notch professional. His illustrations are pure magic. Highly recommend!',
    },
  ],
  recommendation: {
    name: 'Carol Danvers',
    date: '2024-03-01',
    text: 'Worked with Benji on a major branding campaign. His creativity and attention to detail are unparalleled.',
  },
};

// Mock async function to fetch skill data
const fetchSkillData = async (skillId: string, userId: string): Promise<SkillProfileData> => {
  console.log(`Fetching skill data for skillId: ${skillId}, userId: ${userId}`);
  // In a real app, you'd fetch based on skillId and userId
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSkillProfile);
    }, 1000);
  });
}; // TODO: get real data

export default function WorkerSkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, loading: loadingUser } = useAuth();

  const pageUserId = params?.userId as string;
  const skillId = params?.skillId as string;

  const [skillProfile, setSkillProfile] = useState<SkillProfileData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
  useEffect(() => {
    if (loadingUser) {
      return; // Wait for user context to load
    }

    const authUserId = user?.uid; // Use uid from ExtendedUser

    // If after loading, user is authenticated but authUserId is somehow not available
    if (!authUserId) {
        console.error("User is authenticated but UID is missing. Redirecting to signin.");
        router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
        return;
    }

    // Authorization: Ensure the authenticated user is the one whose profile page is being accessed
    if (pageUserId && authUserId !== pageUserId) {
      console.warn(`Authorization Mismatch: Authenticated user ${authUserId} trying to access page for ${pageUserId}. Redirecting.`);
      router.push('/signin?error=unauthorized');
      return;
    }

    // Role check: Ensure the user can be a GigWorker to view their skills
    if (user?.claims.role !== "GIG_WORKER") {
      console.warn(`Role Mismatch: User ${authUserId} is not a GigWorker. Redirecting.`);
      router.push('/select-role');
      return;
    }
    
    // At this point, user is authenticated, authorized for this pageUserId, and has the correct role.
    // Proceed to fetch skill data.
    if (skillId && pageUserId) { 
      setLoadingData(true);
      fetchSkillData(skillId, pageUserId) 
        .then((data) => {
          setSkillProfile(data);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to fetch skill data:', err);
          setError('Failed to load skill profile. Please try again.');
          setSkillProfile(null);
        })
        .finally(() => {
          setLoadingData(false);
        });
    } else if (!skillId) { 
      setError('Skill ID is missing from URL.');
      setLoadingData(false);
    } else if (!pageUserId) { 
        setError('User ID is missing from URL.');
        setLoadingData(false);
    }
  }, [user, loadingUser, pageUserId, skillId, router, pathname]);
  if (loadingUser || loadingData) {
    return (
      <div className={styles.loadingContainer}>
      <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      <p>Loading skill details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error: {error}</p>
        <button onClick={() => router.push('/')} className={styles.homeButton}>
          Go to Homepage
        </button>
      </div>
    );
  }
  */

  if (!mockSkillProfile) {
    // This case should ideally be covered by error state if fetching fails
    // or loading state if data is not yet available.
    // If skillProfile is null after loading and no error, it implies data wasn't found.
    return (
      <div className={styles.errorContainer}>
        <p>Skill profile not found.</p>
        <button onClick={() => router.push(`/user/${pageUserId}/worker/profile`)} className={styles.homeButton}>
          Back to Profile
        </button>
      </div>
    );
  }

  return <SkillSplashScreen profile={mockSkillProfile} />;
}
