/* eslint-disable max-lines-per-function */
"use client";
import React, { useEffect, useRef, useState } from "react";
import useVideoRecorder from "./useVideoRecorder";
import VideoRecorderView from "./VideoRecorderView";

interface VideoRecorderProps {
  onVideoRecorded?: (file: Blob) => void;
  prompt?: string;
  setIsEditingVideo?: (isEditing: boolean) => void;
  isCancelButtonVisible?: boolean;
  isInline?: boolean;
  maxDurationMs?: number;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onVideoRecorded,
  prompt,
  setIsEditingVideo,
  isCancelButtonVisible = true,
  isInline = true,
  maxDurationMs = 30000,
}) => {
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showRecorder, setShowRecorder] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const {
    previewVideoRef,
    startLocalPreview,
    startRecording: hookStartRecording,
    stopRecording: hookStopRecording,
    stopLocalPreview,
    status,
    error,
    revokeUrlIfExists,
    recordingStartRef,
  } = useVideoRecorder({ maxDurationMs, onStop: (b) => {
    if (b) {
      setBlob(b);
      const url = URL.createObjectURL(b);
      setVideoURL(url);
      setIsRecording(false);
      setCountdown(null);
    }
  } });

  // preview attachment and stream management handled by hook

  // startLocalPreview provided by hook

  useEffect(() => {
    if (showRecorder) startLocalPreview();
    else stopLocalPreview();
    return () => stopLocalPreview();
  }, [showRecorder, startLocalPreview, stopLocalPreview]);

  useEffect(() => {
    if (playbackVideoRef.current && videoURL && showVideoPreview) {
      playbackVideoRef.current.src = videoURL;
    }
  }, [videoURL, showVideoPreview]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownTimeoutRef.current = setTimeout(() => setCountdown((c) => (c ? c - 1 : null)), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
    }

    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, [countdown]);

  // useVideoRecorder provides revokeUrlIfExists

  const handleStartRecording = () => {
    revokeUrlIfExists();
    setBlob(null);
    setVideoURL(null);
    setShowVideoPreview(false);
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        s.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      hookStartRecording();
    })();
    setCountdown(3);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    hookStopRecording();
  };

  const handleCancelRecording = () => {
    if (status === "recording") handleStopRecording();
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    revokeUrlIfExists();
    setBlob(null);
    setVideoURL(null);
    setShowVideoPreview(false);
    setCountdown(null);
    setShowRecorder(false);
  };

  const handleRerecord = () => {
    revokeUrlIfExists();
    setBlob(null);
    setVideoURL(null);
    setShowVideoPreview(false);
    setCountdown(null);
    // Ensure the recorder UI is visible (in case we're currently showing the
    // recorded-video preview) so the preview <video> element is rendered.
    setShowRecorder(true);

    // Schedule starting the local preview after the DOM updates so
    // `previewVideoRef.current` is available (it will be null if we call
    // startLocalPreview synchronously while the preview element is not in
    // the tree). A short timeout ensures the element is mounted.
    setTimeout(() => {
      startLocalPreview().catch(() => {});
    }, 50);
  };

  const saveVideo = async () => {
    if (!blob) return;
    if (onVideoRecorded) onVideoRecorded(blob);
    setIsFading(true);
    setTimeout(() => {
      setShowRecorder(false);
      setIsFading(false);
      setShowVideoPreview(false);
      // revoke kept URL after user saves
      revokeUrlIfExists();
      setVideoURL(null);
      setBlob(null);
    }, 300);
  };

  const handleViewVideo = () => setShowVideoPreview(true);

  

  useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
      // In case any URL remained, revoke it on unmount
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);
  return (
    <VideoRecorderView
      prompt={prompt}
      setIsEditingVideo={setIsEditingVideo}
      isCancelButtonVisible={isCancelButtonVisible}
      isInline={isInline}
      maxDurationMs={maxDurationMs}

      showRecorder={showRecorder}
      setShowRecorder={setShowRecorder}
      showVideoPreview={showVideoPreview}
  countdown={countdown}
      videoURL={videoURL}
      isRecording={isRecording}
      isFading={isFading}

      previewVideoRef={previewVideoRef}
      playbackVideoRef={playbackVideoRef}

      status={status}
      error={error}

      handleStartRecording={handleStartRecording}
      handleStopRecording={handleStopRecording}
      handleCancelRecording={handleCancelRecording}
      handleRerecord={handleRerecord}
      saveVideo={saveVideo}
      handleViewVideo={handleViewVideo}

      recordingStartRef={recordingStartRef}
    />
  );
};

export default VideoRecorder;
