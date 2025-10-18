/* eslint-disable max-lines-per-function */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from "./VideoRecorderBubble.module.css";
import { MonitorPlay, Pencil, X } from "lucide-react";
import CancelButton from "../shared/CancelButton";

// Add prop type for onVideoRecorded
interface VideoRecorderOnboardingProps {
  onVideoRecorded?: (file: Blob) => void;
  prompt?: string;
  setIsEditingVideo?: (isEditing: boolean) => void;
  isCancelButtonVisible?: boolean;
  isInline?: boolean;
}

const VideoRecorderOnboarding: React.FC<VideoRecorderOnboardingProps> = ({ onVideoRecorded, prompt, setIsEditingVideo, isCancelButtonVisible = true, isInline = true  }) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
    }
  }, []);

  const resetRecording = () => {
    setVideoURL(null);
    setIsRecording(false);
    setRecordedChunks([]);
    setBlob(null);
    setImageSrc(null);
    setVideoURL(null);
  };

  const handleRecording = () => {
    resetRecording();
    setShowRecorder(true);
  };

  const handleCancelRecording = () => {
    setShowRecorder(false);
  };

  const startRecording = () => {
    resetRecording();
    const stream = webcamRef.current?.stream;
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    setTimeout(() => capture(), 15000);
    setTimeout(() => stopRecording(), 30000);
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveVideo = async () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    console.log("Video URL:", url);
    if (onVideoRecorded) {
      onVideoRecorded(blob);
    }
    // Start fade animation
    setIsFading(true);
    // Close the popup overlay after fade animation, but keep the video preview
    setTimeout(() => {
      setShowRecorder(false);
      setIsFading(false);
      // Don't reset recording to keep the video visible
    }, 300); // 300ms fade duration
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const newBlob = new Blob(recordedChunks, { type: "video/webm" });
      setBlob(newBlob);
      const url = URL.createObjectURL(newBlob);
      setVideoURL(url);
      console.log("Captured image:", imageSrc);
    }
  }, [isRecording, recordedChunks]);

  return (
    <div className={styles.container}>
      {prompt && <div className={styles.prompt}>{prompt}</div>}
      {!showRecorder ? (
        <div className={styles.initial}>
                     {videoURL ? (
             // Show video preview if video exists
             <div className={styles.videoPreview}>
               <video controls src={videoURL} className={styles.video} />
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
          {permissionError ? (
            <div className={styles.error}>{permissionError}</div>
          ) : !videoURL ? (
            <div className={styles.overlay}>
              <div className={styles.recorder}>
                <Webcam
                  ref={webcamRef}
                  audio={true}
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                  videoConstraints={true}
                  className={styles.webcam}
                  onUserMedia={() => {
                    setPermissionError(null);
                    console.log("Webcam stream started");
                  }}
                  onUserMediaError={err => {
                    setPermissionError(
                      "Camera access denied or not available. Please allow camera access and refresh the page."
                    );
                    console.error("Webcam error", err);
                  }}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={styles.controlButton}
                >
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </button>
                <CancelButton handleCancel={handleCancelRecording} />
                <p className={styles.note}>Max duration: 30 seconds</p>
              </div>
            </div>
           
                     ) : (
            <div className={`${styles.overlay} ${isFading ? styles.fadeOut : ''}`}> 
             <div className={styles.preview}>
              <video controls src={videoURL} className={styles.video} />
              <div className={styles.actions}>
                <button onClick={saveVideo} className={`${styles.actionButton} ${styles.saveButton}`}>
                  Save Video
                </button>
                <button
                  onClick={() => {
                    setVideoURL(null);
                    setRecordedChunks([]);
                    setBlob(null);
                  }}
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
