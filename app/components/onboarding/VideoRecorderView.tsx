/* Presentational component for the video recorder UI. Receives state and
   handler props from the logic wrapper so this file remains visual-only. */
"use client";
import React from "react";
import styles from "./VideoRecorder.module.css";
import { MonitorPlay, Eye } from "lucide-react";
import CancelButton from "../shared/CancelButton";

interface VideoRecorderViewProps {
  prompt?: string;
  setIsEditingVideo?: (b: boolean) => void;
  isCancelButtonVisible?: boolean;
  isInline?: boolean;
  maxDurationMs: number;

  showRecorder: boolean;
  setShowRecorder: (v: boolean) => void;
  showVideoPreview: boolean;
  countdown: number | null;
  videoURL: string | null;
  isRecording: boolean;
  isFading: boolean;

  previewVideoRef: React.RefObject<HTMLVideoElement | null>;
  playbackVideoRef: React.RefObject<HTMLVideoElement | null>;

  status?: string;
  error?: string | null;

  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handleCancelRecording: () => void;
  handleRerecord: () => void;
  saveVideo: () => Promise<void>;
  handleViewVideo: () => void;

  recordingStartRef: React.RefObject<number | null>;
}

const RemainingTimerInner: React.FC<{ startTime: number | null; maxMs: number }> = ({ startTime, maxMs }) => {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
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

const VideoRecorderView: React.FC<VideoRecorderViewProps> = ({
  prompt,
  setIsEditingVideo,
  isCancelButtonVisible = true,
  isInline = true,
  maxDurationMs,

  showRecorder,
  setShowRecorder,
  showVideoPreview,
  countdown,
  videoURL,
  isRecording,
  isFading,

  previewVideoRef,
  playbackVideoRef,

  status,
  error,

  handleStartRecording,
  handleStopRecording,
  handleCancelRecording,
  handleRerecord,
  saveVideo,
  handleViewVideo,

  recordingStartRef,
}) => {
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
                  <video ref={playbackVideoRef} controls className={styles.video} style={{ width: "100%", height: "auto", transform: "scaleX(-1)" }} />
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

export default VideoRecorderView;
