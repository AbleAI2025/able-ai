"use client";

import { useRouter, usePathname, ReadonlyURLSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/app/components/shared/Loader';
import { useAuth } from '@/context/AuthContext';
import AIChatView from './AIChatView';

export interface SuggestedAction {
  text: string;
  linkKey?: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  suggestedActions?: SuggestedAction[];
}

interface AIChatContainerProps {
  userId: string;
  searchParams: ReadonlyURLSearchParams;
}

export default function AIChatContainer({ userId, searchParams }: AIChatContainerProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const linkKeyRoutes: { [key: string]: string } = {
    PROFILE_EDIT: `/user/${userId}/profile/edit`,
    VIEW_OFFERS: `/user/${userId}/offers`,
    POST_GIG: `/user/${userId}/gigs/new`,
    BROWSE_GIGS: `/user/${userId}/gigs/browse`,
  };
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const authUserId = user?.uid;
  const pageUserId = userId;

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (authUserId !== pageUserId) {
          router.replace("/");
          return;
        }
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, authUserId, pageUserId, pathname, router]);

  useEffect(() => {
    const suggestionParam = searchParams.get('suggestion');
    if (suggestionParam) {
      try {
        const savedSuggestion = localStorage.getItem('lastAISuggestion');
        if (savedSuggestion) {
          try {
            setSuggestion(JSON.parse(savedSuggestion));
          } catch (e) {
            console.error('Failed to parse saved suggestion:', e);
          }
        } else {
          const decodedSuggestion = JSON.parse(decodeURIComponent(suggestionParam));
          setSuggestion(decodedSuggestion);
        }
      } catch (e) {
        console.error('Failed to parse suggestion:', e);
      }
    } else {
      const savedSuggestion = localStorage.getItem('lastAISuggestion');
      if (savedSuggestion) {
        try {
          setSuggestion(JSON.parse(savedSuggestion));
        } catch (e) {
          console.error('Failed to parse saved suggestion:', e);
        }
      }
    }
  }, [searchParams]);

  const handleActionClick = (action: SuggestedAction) => {
    if (action.linkKey) {
      const route = linkKeyRoutes[action.linkKey];
      if (route) {
        router.push(route);
      } else {
        alert(`Action: '${action.text}' - This suggested navigation path ('${action.linkKey}') is not configured yet.`);
      }
    } else {
      alert(`Action: Send '${action.text}' to chat. Chat input to be implemented.`);
    }
  };

  if (loading || !user || (authUserId && authUserId !== pageUserId)) {
    return <Loader />;
  }

  return (
    <AIChatView
      suggestion={suggestion}
      onActionClick={handleActionClick}
    />
  );
} 