/* eslint-disable max-lines-per-function */
"use client";
import React, { useEffect, useRef, useState } from "react";
import useVideoRecorder from "./useVideoRecorder";
import styles from "./VideoRecorder.module.css";
import { MonitorPlay, Eye } from "lucide-react";
import CancelButton from "../shared/CancelButton";

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

  // Small child component handles its own ticking so the parent doesn't
  // re-render frequently while the remaining time updates.
  const RemainingTimerInner: React.FC<{ startTime: number | null; maxMs: number }> = ({ startTime, maxMs }) => {
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
      if (!startTime) {
        setRemaining(null);
        return;
      }

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const rem = Math.max(0, maxMs - elapsed);
        setRemaining(rem);
      };

      tick();
      const id = setInterval(tick, 250);
      return () => clearInterval(id);
    }, [startTime, maxMs]);

    if (remaining === null) return null;
    return <>{Math.ceil(remaining / 1000)} seconds to finish</>;
  };

  const RemainingTimer = React.memo(RemainingTimerInner);

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
  } = useVideoRecorder({
    maxDurationMs,
    onStop: (b) => {
      if (b) {
        setBlob(b);
        const url = URL.createObjectURL(b);
        setVideoURL(url);
        setIsRecording(false);
        setCountdown(null);
      }
    },
  });

  // preview attachment and stream management handled by hook

  // startLocalPreview provided by hook

  useEffect(() => {
    if (showRecorder) {
      startLocalPreview();
    } else {
      stopLocalPreview();
    }

    return () => {
      stopLocalPreview();
    };
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
    // Ensure microphone permission is requested before starting the
    // recording. If we already have a preview stream with audio (local or
    // from the hook) this call will resolve quickly; otherwise request it.
    (async () => {
      try {
        // Request microphone permission to ensure the browser prompt appears
        // before starting the recording. We don't keep the stream.
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        s.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore permission failure; hook will report errors
      }
      hookStartRecording();
    })();
    setCountdown(3);
    setIsRecording(true);
    // recordingStartRef updated inside hook startRecording wrapper
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

  const getErrorMessage = () => {
    switch (error || status) {
      case "permission_denied":
        return "Camera access denied. Please allow camera access and refresh the page.";
      case "media_aborted":
        return "Media recording was aborted.";
      case "no_specified_media_found":
        return "No camera or microphone found.";
      case "media_in_use":
        return "Camera or microphone is already in use.";
      case "invalid_media_constraints":
        return "Invalid media settings.";
      default:
        return "An error occurred accessing your camera/microphone.";
    }
  };

  useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
      // In case any URL remained, revoke it on unmount
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);

  return (
    <div className={styles.container}>
      {prompt && <div className={styles.prompt}>{prompt}</div>}
      {!showRecorder ? (
        <div className={styles.initial}>
          {videoURL ? (
            <div className={styles.videoPreview}>
              <button onClick={handleViewVideo} className={`${styles.actionButton} ${styles.viewButton}`}>
                <Eye color="#fff" />
                <span>VIEW RECORDED VIDEO</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRecorder(true)}
              className={`${styles.recordButton} ${isInline ? styles.inline : styles.column}`}
            >
              <MonitorPlay color="#fff" className={styles.monitorPlay} />
              <span>RECORD VIDEO</span>
            </button>
          )}
          {isCancelButtonVisible && setIsEditingVideo && (
            <CancelButton handleCancel={() => setIsEditingVideo(false)} />
          )}
        </div>
      ) : (
        <>
          {error || (status && [
            "permission_denied",
            "media_aborted",
            "no_specified_media_found",
            "media_in_use",
            "invalid_media_constraints",
          ].includes(status)) ? (
            <div className={styles.error}>{getErrorMessage()}</div>
          ) : !videoURL ? (
            <div className={styles.overlay}>
              <div className={styles.recorder}>
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.webcam}
                  style={{ transform: "scaleX(-1)" }}
                />

                {countdown !== null && (
                  <div className={styles.countdownOverlay}>
                    <div className={styles.countdown}>{countdown}</div>
                    <p className={styles.countdownText}>Preparing audio...</p>
                    <p className={styles.countdownSubtext}>Please wait before speaking</p>
                  </div>
                )}

                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={styles.controlButton}
                  disabled={status === "acquiring_media" || countdown !== null}
                >
                  {isRecording ? "Stop Recording" : status === "acquiring_media" ? "Loading..." : "Start Recording"}
                </button>

                <CancelButton handleCancel={handleCancelRecording} />
                <p className={styles.note}>
                  {isRecording ? (
                    <RemainingTimer startTime={recordingStartRef.current} maxMs={maxDurationMs} />
                  ) : (
                    <>Max duration: {Math.round(maxDurationMs / 1000)} seconds</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className={`${styles.overlay} ${isFading ? styles.fadeOut : ""}`}>
              <div className={styles.preview}>
                {showVideoPreview ? (
                  <video ref={playbackVideoRef} controls className={styles.video} style={{ width: "100%", height: "auto" }} />
                ) : (
                  <div className={styles.viewVideoContainer}>
                    <button onClick={handleViewVideo} className={`${styles.actionButton} ${styles.viewButton}`}>
                      <Eye color="#fff" />
                      <span>VIEW RECORDED VIDEO</span>
                    </button>
                  </div>
                )}
                <div className={styles.actions}>
                  <button onClick={saveVideo} className={`${styles.actionButton} ${styles.saveButton}`}>Save Video</button>
                  <button onClick={handleRerecord} className={`${styles.actionButton} ${styles.rerecordButton}`}>Re-record</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoRecorder;
