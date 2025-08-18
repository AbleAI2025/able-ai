// app/components/shared/AiSuggestionBanner.tsx
"use client";

import React, { useCallback } from "react"; // Added useCallback
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./AiSuggestionBanner.module.css";

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

interface AiSuggestionBannerProps {
  suggestions: Suggestion[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  dismissed: boolean;
  onDismiss: () => void;
  onRefresh: () => void;
  goToNext: () => void;
  goToPrev: () => void;
  userId: string;
  className?: string;
}

export default function AiSuggestionBanner({
  suggestions,
  currentIndex,
  isLoading,
  error,
  dismissed,
  onDismiss,
  onRefresh,
  goToNext,
  goToPrev,
  userId,
  className = "",
}: AiSuggestionBannerProps) {
  const router = useRouter();
  const currentSuggestion =
    suggestions && suggestions.length > 0 && currentIndex < suggestions.length
      ? suggestions[currentIndex]
      : null;

  const handleSuggestionInteraction = useCallback(() => {
    if (!userId || !currentSuggestion) return;

    const suggestionWithTimestamp = {
      ...currentSuggestion,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(
      "lastAISuggestion",
      JSON.stringify(suggestionWithTimestamp)
    );

    const encodedSuggestion = encodeURIComponent(
      JSON.stringify(suggestionWithTimestamp)
    );
    router.push(`/user/${userId}/able-ai?suggestion=${encodedSuggestion}`);
  }, [userId, currentSuggestion, router]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        handleSuggestionInteraction();
      }
    },
    [handleSuggestionInteraction]
  );

  const handleGoToPrev = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      goToPrev();
    },
    [goToPrev]
  );

  const handleGoToNext = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      goToNext();
    },
    [goToNext]
  );

  if (dismissed) {
    return (
      <div
        className={`${styles.suggestionBanner} ${styles.suggestionTextContainer} ${className}`}
      >
        <p className={styles.dismissedText}>AI suggestions are hidden.</p>
        {/* Ensure onRefresh is memoized if coming from props, or if defined in parent, it should be stable */}
        <button onClick={onRefresh}>
          Show Ideas
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${styles.suggestionTextContainer} ${className} ${styles.suggestionBanner}`}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`}>...</div>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}>...</div>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`}>...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles.suggestionBanner} ${styles.error} ${className}`}
      >
        Error: {error}
        <button
          onClick={onRefresh} // Ensure onRefresh is memoized if coming from props
          className={styles.refreshButtonIcon}
          aria-label="Refresh suggestions"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    );
  }

  if (!currentSuggestion) {
    return null;
  }

  return (
    <div
      className={`${styles.suggestionBanner} ${className}`}
      role="region"
      aria-labelledby="ai-suggestion-banner-heading"
    >
      <div className={styles.topRowContainer}>
        <div
          className={styles.suggestionTextContainer}
          onClick={handleSuggestionInteraction}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-live="polite"
        >
          <p className={styles.suggestionDescription}>
            {currentSuggestion.description}
          </p>
        </div>
      </div>

      <div className={styles.bottomControlsContainer}>
        <button
          onClick={onDismiss} // Ensure onDismiss is memoized if coming from props
          className={styles.dismissButton}
          aria-label="Dismiss suggestions"
        >
          <X size={18} />
        </button>

        <button
          onClick={onRefresh} // Ensure onRefresh is memoized if coming from props
          className={styles.refreshButtonIcon}
          aria-label="Refresh suggestions"
        >
          <RefreshCw size={18} />
        </button>

        {suggestions.length > 1 && (
          <div className={styles.inlineCarouselControls}>
            <button
              onClick={handleGoToPrev}
              className={styles.navButton}
              aria-label="Previous suggestion"
            >
              <ChevronLeft size={20} />
            </button>
            <span
              className={styles.suggestionCounter}
              aria-label={`Suggestion ${currentIndex + 1} of ${
                suggestions.length
              }`}
            >
              {currentIndex + 1} / {suggestions.length}
            </span>
            <button
              onClick={handleGoToNext}
              className={styles.navButton}
              aria-label="Next suggestion"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* <button
          onClick={handleSuggestionInteraction}
          className={styles.chatButton}
          aria-label="Chat about this suggestion"
        >
          <MessageSquare size={40} />{" "}
        </button> */}
      </div>
    </div>
  );
}
