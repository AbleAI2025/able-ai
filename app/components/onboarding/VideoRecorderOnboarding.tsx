/* eslint-disable max-lines-per-function */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import styles from "./VideoRecorderBubble.module.css";
import { MonitorPlay, Pencil, X, Eye } from "lucide-react";
import CancelButton from "../shared/CancelButton";

// Add prop type for onVideoRecorded
interface VideoRecorderOnboardingProps {
  onVideoRecorded?: (file: Blob) => void;
  prompt?: string;
  setIsEditingVideo?: (isEditing: boolean) => void;
  isCancelButtonVisible?: boolean;
  isInline?: boolean;
}

const VideoRecorderOnboarding: React.FC<VideoRecorderOnboardingProps> = ({ 
  onVideoRecorded, 
  prompt, 
  setIsEditingVideo, 
  isCancelButtonVisible = true, 
  isInline = true  
}) => {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // States from original component
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  
  // Using react-media-recorder hook
  const {
    status,
    startRecording,
    stopRecording,
    previewStream,
    error,
  } = useReactMediaRecorder({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
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
      if (blob) {
        setBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
        setIsRecording(false);
        setCountdown(null);
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
    
    return () => {
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    };
  }, [previewStream]);

  // Set up playback video when URL is available and preview is requested
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
      // Countdown finished
      setCountdown(null);
    }
    
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, [countdown]);

  // Handle errors and permission status
  useEffect(() => {
    if (error) {
      setPermissionError(getErrorMessage());
    } else if (status === "idle") {
      setPermissionError(null);
    }
  }, [error, status]);

  // Get error message based on status or error
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
        return "Invalid media settings. Please try again or use a different device.";
      default:
        return "An error occurred accessing your camera/microphone.";
    }
  };

  // Screenshot functionality - adapted for react-media-recorder
  const capture = useCallback(() => {
    if (previewVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = previewVideoRef.current.videoWidth;
      canvas.height = previewVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image horizontally to match the webcam view
        ctx.scale(-1, 1);
        ctx.drawImage(previewVideoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        const imageDataURL = canvas.toDataURL('image/jpeg');
        setImageSrc(imageDataURL);
      }
    }
  }, []);

  const resetRecording = () => {
    setVideoURL(null);
    setIsRecording(false);
    setBlob(null);
    setImageSrc(null);
    setPermissionError(null);
    setShowVideoPreview(false);
    setCountdown(null);
    
    // Clear any timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
  };

  const handleRecording = () => {
    resetRecording();
    setShowRecorder(true);
  };

  const handleCancelRecording = () => {
    if (status === "recording") {
      stopRecording();
    }
    setShowRecorder(false);
    resetRecording();
  };

  const handleStartRecording = () => {
    resetRecording();
    // Clear any previous errors
    setPermissionError(null);
    
    // Start the countdown
    setCountdown(3);
    
    // Start recording after a short delay to allow countdown to show
    setTimeout(() => {
      startRecording();
      setIsRecording(true);
      
      // Set timeouts to match original component
      setTimeout(() => capture(), 15000);
      recordingTimeoutRef.current = setTimeout(() => stopRecording(), 30000);
    }, 100);
  };

  // Renamed from stopRecording to avoid conflict with hook's stopRecording
  const handleStopRecording = () => {
    if (status === "recording") {
      stopRecording();
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  const saveVideo = async () => {
    if (!blob) return;
    
    if (onVideoRecorded) {
      onVideoRecorded(blob);
    }
    
    // Start fade animation
    setIsFading(true);
    // Close the popup overlay after fade animation, but keep the video preview
    setTimeout(() => {
      setShowRecorder(false);
      setIsFading(false);
      setShowVideoPreview(false);
      // Don't reset recording to keep the video visible
    }, 300); // 300ms fade duration
  };

  // Function to handle viewing the video
  const handleViewVideo = () => {
    setShowVideoPreview(true);
  };

  // Function to handle re-recording
  const handleRerecord = () => {
    setVideoURL(null);
    setBlob(null);
    setShowVideoPreview(false);
  };

  // Check if we should show an error
  const shouldShowError = () => {
    return error || (status && [
      "permission_denied",
      "media_aborted",
      "no_specified_media_found",
      "media_in_use",
      "invalid_media_constraints",
    ].includes(status));
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
            <button
              onClick={handleRecording}
              className={`${styles.recordButton} ${
                isInline ? styles.inline : styles.column
              }`}
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
          {shouldShowError() ? (
            <div className={styles.error}>{getErrorMessage()}</div>
          ) : !videoURL ? (
            <div className={styles.overlay}>
              <div className={styles.recorder}>
                {/* Video preview using native video element instead of Webcam */}
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.webcam}
                  style={{ 
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
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={styles.controlButton}
                  disabled={status === "acquiring_media" || countdown !== null}
                >
                  {isRecording ? "Stop Recording" : 
                   status === "acquiring_media" ? "Loading..." : "Start Recording"}
                </button>
                
                <CancelButton handleCancel={handleCancelRecording} />
                <p className={styles.note}>Max duration: 30 seconds</p>
              </div>
            </div>
          ) : (
            <div className={`${styles.overlay} ${isFading ? styles.fadeOut : ''}`}> 
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
                  <button onClick={saveVideo} className={`${styles.actionButton} ${styles.saveButton}`}>
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

export default VideoRecorderOnboarding;