import { useCallback, useEffect, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";

export interface UseVideoRecorderOptions {
  maxDurationMs?: number;
  onStop?: (blob: Blob | null) => void;
}

export const useVideoRecorder = ({ maxDurationMs = 30000, onStop }: UseVideoRecorderOptions = {}) => {
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const localPreviewStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const countdownTimeoutRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);

  const {
    status,
    startRecording: rmStartRecording,
    stopRecording: rmStopRecording,
    previewStream,
    error,
  } = useReactMediaRecorder({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    blobPropertyBag: { type: "video/webm;codecs=vp9" },
    onStop: (_blobUrl, b) => {
      if (onStop) onStop(b || null);
    },
  });

  const revokeUrlIfExists = useCallback((url?: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const stopLocalPreview = useCallback(() => {
    if (localPreviewStreamRef.current) {
      localPreviewStreamRef.current.getTracks().forEach((t) => t.stop());
      localPreviewStreamRef.current = null;
    }
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
  }, []);

  const startLocalPreview = useCallback(async (requestAudio = false) => {
    const maxAttempts = 10;
    const delayMs = 50;
    let el: HTMLVideoElement | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
      el = previewVideoRef.current;
      if (el) break;
      // small delay then retry
      await new Promise((r) => setTimeout(r, delayMs));
    }
    if (!el) return;

    try {
      // stop any existing local preview first
      if (localPreviewStreamRef.current) {
        localPreviewStreamRef.current.getTracks().forEach((t) => t.stop());
        localPreviewStreamRef.current = null;
      }
      const constraints: MediaStreamConstraints = requestAudio
        ? { video: { facingMode: "user" }, audio: true }
        : { video: { facingMode: "user" } };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      // If the hook later provides a previewStream, we'll stop this local
      // stream in the previewStream effect. For now attach it.
      localPreviewStreamRef.current = s;
      el.srcObject = s;
      el.muted = true;
      el.playsInline = true;
      el.play().catch(() => {});
    } catch {
      // ignore permission or device errors; caller shows errors
    }
  }, []);

  // Attach react-media-recorder's preview stream to the preview element when
  // it becomes available. Prefer the hook-provided stream over any locally
  // created preview stream and stop the local stream if present.
  useEffect(() => {
    const el = previewVideoRef.current;
    if (el && previewStream) {
      if (localPreviewStreamRef.current) {
        localPreviewStreamRef.current.getTracks().forEach((t) => t.stop());
        localPreviewStreamRef.current = null;
      }
      el.srcObject = previewStream;
      el.muted = true;
      el.playsInline = true;
      el.play().catch(() => {});
      return () => {
        if (el && el.srcObject === previewStream) el.srcObject = null;
      };
    }
    return undefined;
  }, [previewStream, stopLocalPreview]);

  useEffect(() => () => {
    if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
    if (countdownTimeoutRef.current) window.clearTimeout(countdownTimeoutRef.current);
    if (localPreviewStreamRef.current) {
      localPreviewStreamRef.current.getTracks().forEach((t) => t.stop());
      localPreviewStreamRef.current = null;
    }
  }, []);

  return {
    previewVideoRef,
    startLocalPreview,
    startRecording: (maxMs = maxDurationMs) => {
      recordingStartRef.current = Date.now();
      rmStartRecording();
      recordingTimeoutRef.current = window.setTimeout(() => rmStopRecording(), maxMs);
    },
    stopRecording: () => {
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      rmStopRecording();
    },
    stopLocalPreview,
    status,
    error,
    revokeUrlIfExists,
    recordingStartRef,
  } as const;
};

export default useVideoRecorder;
