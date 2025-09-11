/* eslint-disable max-lines-per-function */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import styles from "./VideoRecorderBubble.module.css";
import { MonitorPlay, Eye } from "lucide-react";
import CancelButton from "../shared/CancelButton";

interface VideoRecorderBubbleProps {
  onVideoRecorded?: (file: Blob) => void;
  prompt?: string;
  setIsEditingVideo?: (isEditing: boolean) => void;
  isCancelButtonVisible?: boolean;
}

const VideoRecorderBubble: React.FC<VideoRecorderBubbleProps> = ({
  onVideoRecorded,
  prompt,
  setIsEditingVideo,
  isCancelButtonVisible = true,
}) => {
  const [showRecorder, setShowRecorder] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  
  // These match the old implementation exactly
  const [blob, setBlob] = useState<Blob | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    previewStream,
    clearBlobUrl,
    error,
  } = useReactMediaRecorder({
    video: {
      width: 1280,
      height: 720,
      facingMode: "user",
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    blobPropertyBag: {
      type: "video/webm;codecs=vp9",
    },
    onStop: (blobUrl, blob) => {
      console.log("Recording stopped:", blobUrl);
      // This is the equivalent of your old useEffect
      if (blob) {
        setBlob(blob);
        // Create and save the URL exactly like in your old code
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
        console.log("Video URL created:", url);
      }
    },
  });

  // Set up preview stream with proper attributes
  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
      previewVideoRef.current.muted = true;
      previewVideoRef.current.playsInline = true;
      previewVideoRef.current.play().catch(console.error);
    }
    
    // Cleanup function
    return () => {
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    };
  }, [previewStream]);

  // Only set up the video when the user explicitly wants to see it
  useEffect(() => {
    if (playbackVideoRef.current && videoURL && showVideoPreview) {
      playbackVideoRef.current.src = videoURL;
    }
  }, [videoURL, showVideoPreview]);

  // Handle countdown
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownTimeoutRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Countdown finished, just hide it
      setCountdown(null);
    }
    
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, [countdown]);

  const handleStartRecording = () => {
    // Reset our state but don't interfere with the library's state
    setBlob(null);
    setVideoURL(null);
    setShowVideoPreview(false);
    
    // Start recording immediately
    startRecording();
    
    // Start the countdown to show on screen
    setCountdown(3);
    
    // Auto-stop recording after 30 seconds
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 30000);
  };

  const handleStopRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    stopRecording();
  };

  const handleRecording = () => {
    setShowRecorder(true);
  };

  const handleCancelRecording = () => {
    if (status === "recording") {
      handleStopRecording();
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    // Reset our state but don't interfere with the library's state
    setBlob(null);
    setVideoURL(null);
    setShowVideoPreview(false);
    setCountdown(null);
    setShowRecorder(false);
  };

  const saveVideo = async () => {
    if (blob && onVideoRecorded) {
      try {
        console.log("Saving video blob:", blob);
        onVideoRecorded(blob);
        
        // Reset the recorder after saving
        setShowRecorder(false);
        setShowVideoPreview(false);
        setCountdown(null);
        // Reset our state but don't interfere with the library's state
        setBlob(null);
        setVideoURL(null);
        console.log("Video saved successfully");
      } catch (err) {
        console.error("Error saving video:", err);
      }
    } else {
      console.log("No blob or onVideoRecorded callback available");
    }
  };

  const handleRerecord = () => {
    // Reset our state but don't interfere with the library's state
    setBlob(null);
    setVideoURL(null);
    setShowVideoPreview(false);
    setCountdown(null);
  };

  // New function to handle viewing the video
  const handleViewVideo = () => {
    setShowVideoPreview(true);
  };

  // Cleanup timeouts and URLs
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
      // Only revoke the URL if we're not showing it anymore
      if (videoURL && !showRecorder && !showVideoPreview) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [videoURL, showRecorder, showVideoPreview]);

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
            // Show a button to view the recorded video
            <div className={styles.videoPreview}>
              <button 
                onClick={handleViewVideo} 
                className={`${styles.actionButton} ${styles.viewButton}`}
              >
                <Eye color="#fff" />
                <span>VIEW RECORDED VIDEO</span>
              </button>
            </div>
          ) : (
            // Show record button if no video
            <button onClick={handleRecording} className={styles.recordButton}>
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
          {error ||
          (status &&
            [
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
                {/* Live preview with proper attributes */}
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.webcam}
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    transform: 'scaleX(-1)' // Mirror the video like react-webcam did
                  }}
                />
                
                {/* Show countdown overlay when recording is starting */}
                {countdown !== null && (
                  <div className={styles.countdownOverlay}>
                    <div className={styles.countdown}>{countdown}</div>
                    <p className={styles.countdownText}>Preparing audio...</p>
                    <p className={styles.countdownSubtext}>Please wait before speaking</p>
                  </div>
                )}
                
                <button
                  onClick={
                    status === "recording"
                      ? handleStopRecording
                      : handleStartRecording
                  }
                  className={styles.controlButton}
                  disabled={status === "acquiring_media" || countdown !== null}
                >
                  {status === "recording"
                    ? "Stop Recording"
                    : status === "acquiring_media"
                    ? "Loading..."
                    : "Start Recording"}
                </button>
                
                <CancelButton handleCancel={handleCancelRecording} />
                <p className={styles.note}>Max duration: 30 seconds</p>
              </div>
            </div>
          ) : (
            <div className={styles.overlay}>
              <div className={styles.preview}>
                {showVideoPreview ? (
                  // Only show the video when the user clicks the view button
                  <video
                    ref={playbackVideoRef}
                    controls
                    className={styles.video}
                    style={{ width: '100%', height: 'auto' }}
                  />
                ) : (
                  // Show a button to view the video instead of auto-loading
                  <div className={styles.viewVideoContainer}>
                    <button 
                      onClick={handleViewVideo} 
                      className={`${styles.actionButton} ${styles.viewButton}`}
                    >
                      <Eye color="#fff" />
                      <span>VIEW RECORDED VIDEO</span>
                    </button>
                  </div>
                )}
                <div className={styles.actions}>
                  <button
                    onClick={saveVideo}
                    className={`${styles.actionButton} ${styles.saveButton}`}
                  >
                    Save Video
                  </button>
                  <button
                    onClick={handleRerecord}
                    className={`${styles.actionButton} ${styles.rerecordButton}`}
                  >
                    Re-record
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoRecorderBubble;
