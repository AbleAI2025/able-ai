// app/hooks/useAiSuggestionBanner.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SuggestedAction, Suggestion } from '@/app/components/shared/AiSuggestionBanner';
import { generateSuggestions } from '@/lib/agents/suggestionBannerAgent';

interface UseAiSuggestionBannerProps {
  role: 'buyer' | 'worker';
  userId: string;
  context?: Record<string, unknown>;
  enabled?: boolean;
  defaultSuggestions?: Suggestion[];
}

const LONG_TERM_DISMISS_KEY_PREFIX = 'aiSuggestionDismissed_';
const SUGGESTION_BATCH_SESSION_KEY_PREFIX = 'suggestionBatch_';
const SUGGESTION_INDEX_SESSION_KEY_PREFIX = 'suggestionBatchIndex_';

export function useAiSuggestionBanner({
  role,
  userId,
  context = {},
  enabled = true,
  defaultSuggestions = [],
}: UseAiSuggestionBannerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const suggestionsRef = useRef(suggestions);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  const getLongTermDismissKey = useCallback(() => `${LONG_TERM_DISMISS_KEY_PREFIX}${userId}_${role}`,
    [userId, role]
  );
  const getSuggestionBatchSessionKey = useCallback(() => `${SUGGESTION_BATCH_SESSION_KEY_PREFIX}${userId}_${role}`,
    [userId, role]
  );
  const getSuggestionIndexSessionKey = useCallback(() => `${SUGGESTION_INDEX_SESSION_KEY_PREFIX}${userId}_${role}`,
    [userId, role]
  );

  // Keep suggestionsRef updated with the latest suggestions state
  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const [isLongTermDismissed, setIsLongTermDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(getLongTermDismissKey()) === 'true';
  });

  const fetchSuggestions = useCallback(async (isExplicitRefresh = false) => {
    if (isLongTermDismissed || !enabled || !userId) return;

    // If not an explicit refresh, and suggestions already exist (from session), don't re-fetch
    // This check is important if fetchSuggestions is called from elsewhere after initial load
    // Use suggestionsRef to get the latest length without making suggestions a direct dep of useCallback
    if (!isExplicitRefresh && suggestionsRef.current.length > 0) {
      setIsLoading(false); // Ensure loading is false if we skip fetching
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let fetchedBatch = await generateSuggestions(context, role);
      if (!fetchedBatch || fetchedBatch.length === 0) {
        fetchedBatch = defaultSuggestions.map((s: { title: string; description: string; }) => ({ ...s, id: crypto.randomUUID(), suggestedActions: [] as SuggestedAction[] }));
      }
      
      const batchWithIds = fetchedBatch.map((s: Partial<Suggestion> & Required<Pick<Suggestion, 'title' | 'description'>>) => ({
        title: s.title,
        description: s.description,
        id: s.id || crypto.randomUUID(), // Ensure ID exists
        suggestedActions: s.suggestedActions || ([] as SuggestedAction[]), // Ensure suggestedActions exists and defaults to empty array
      }));

      setSuggestions(batchWithIds);
      setCurrentIndex(0);
      if (typeof window !== 'undefined') {
        if (batchWithIds.length > 0) {
          sessionStorage.setItem(getSuggestionBatchSessionKey(), JSON.stringify(batchWithIds));
          sessionStorage.setItem(getSuggestionIndexSessionKey(), '0');
        } else {
          sessionStorage.removeItem(getSuggestionBatchSessionKey());
          sessionStorage.removeItem(getSuggestionIndexSessionKey());
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err);
      setError('Failed to load suggestions.');
      // Fallback to default suggestions on error
      const defaultBatchWithIds = defaultSuggestions.map((s: { title: string; description: string; }) => ({ ...s, id: crypto.randomUUID(), suggestedActions: [] as SuggestedAction[] }));
      setSuggestions(defaultBatchWithIds);
      setCurrentIndex(0);
      if (typeof window !== 'undefined') {
        if (defaultBatchWithIds.length > 0) {
          sessionStorage.setItem(getSuggestionBatchSessionKey(), JSON.stringify(defaultBatchWithIds));
          sessionStorage.setItem(getSuggestionIndexSessionKey(), '0');
        } else {
           sessionStorage.removeItem(getSuggestionBatchSessionKey());
           sessionStorage.removeItem(getSuggestionIndexSessionKey());
        }
      }
    }
    setIsLoading(false);
  }, [
    isLongTermDismissed, enabled, userId, context, role, defaultSuggestions,
    getSuggestionBatchSessionKey, getSuggestionIndexSessionKey,
    // State setters are stable and can be included for completeness or if ESLint insists
    setIsLoading, setError, setSuggestions, setCurrentIndex
  ]);

  // Load initial batch and index from session storage, or fetch if not available
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled || !userId || isLongTermDismissed) {
      if(isLongTermDismissed || !enabled || !userId) setIsLoading(false); // Ensure loading stops if conditions not met
      return;
    }

    const storedBatchStr = sessionStorage.getItem(getSuggestionBatchSessionKey());
    if (storedBatchStr) {
      try {
        const storedBatch = JSON.parse(storedBatchStr);
        if (Array.isArray(storedBatch) && storedBatch.length > 0) {
          const storedIndexStr = sessionStorage.getItem(getSuggestionIndexSessionKey()); // Define storedIndexStr here
          setSuggestions(storedBatch);
          const storedIndex = storedIndexStr ? parseInt(storedIndexStr, 10) : 0;
          setCurrentIndex(Math.min(Math.max(0, storedIndex), storedBatch.length - 1));
          setIsLoading(false); // Successfully loaded from session
          return; // Found in session, no immediate fetch needed
        }
      } catch (e) {
        console.error('Failed to parse suggestion batch from session storage:', e);
        sessionStorage.removeItem(getSuggestionBatchSessionKey());
        sessionStorage.removeItem(getSuggestionIndexSessionKey());
        // Fall through to fetch if parsing failed
      }
    }
    // If not in session storage or parsing failed, fetch new suggestions
    console.log('No valid batch in session, proceeding to fetchSuggestions from initial useEffect.');
    fetchSuggestions(); // Now fetchSuggestions is defined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, isLongTermDismissed]);

  // Update long-term dismissed state if key changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsLongTermDismissed(localStorage.getItem(getLongTermDismissKey()) === 'true');
  }, [getLongTermDismissKey]);

  const dismiss = useCallback(() => { // Long-term dismissal
    if (typeof window !== 'undefined') {
      localStorage.setItem(getLongTermDismissKey(), 'true');
      sessionStorage.removeItem(getSuggestionBatchSessionKey());
      sessionStorage.removeItem(getSuggestionIndexSessionKey());
    }
    setIsLongTermDismissed(true);
    setSuggestions([]);
    setCurrentIndex(0);
  }, [getLongTermDismissKey, getSuggestionBatchSessionKey, getSuggestionIndexSessionKey]);

  const refresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      // No need to remove longTermDismissKey here, refresh implies user wants new suggestions NOW,
      // but doesn't necessarily mean they want to un-dismiss it forever.
      // If they were dismissed, this refresh will show suggestions for this session only.
      // To permanently un-dismiss, they might need a different control or settings option.
      // For now, refresh will fetch new ones, and they'll be gone if page reloads & still long-term dismissed.
      // OR, we can decide refresh DOES clear long-term dismissal:
      localStorage.removeItem(getLongTermDismissKey()); // Let's try this: refresh also un-dismisses.
      sessionStorage.removeItem(getSuggestionBatchSessionKey());
      sessionStorage.removeItem(getSuggestionIndexSessionKey());
    }
    setIsLongTermDismissed(false); // If we clear the key, update state
    setSuggestions([]);
    setCurrentIndex(0);
    setError(null);
    fetchSuggestions(true); // Pass true for explicit refresh
  }, [getLongTermDismissKey, getSuggestionBatchSessionKey, getSuggestionIndexSessionKey, fetchSuggestions]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex === suggestions.length - 1 ? 0 : prevIndex + 1;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(getSuggestionIndexSessionKey(), nextIndex.toString());
      }
      return nextIndex;
    });
  }, [suggestions.length, getSuggestionIndexSessionKey]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const prevIndexVal = prevIndex === 0 ? suggestions.length - 1 : prevIndex - 1;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(getSuggestionIndexSessionKey(), prevIndexVal.toString());
      }
      return prevIndexVal;
    });
  }, [suggestions.length, getSuggestionIndexSessionKey]);

  return {
    suggestions,
    currentIndex,
    isLoading,
    error,
    dismissed: isLongTermDismissed,
    dismiss,
    refresh,
    goToNext,
    goToPrev,
  };
}
