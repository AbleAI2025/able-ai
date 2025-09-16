"use client";
import React from "react";
import VideoRecorder from "./VideoRecorder";

interface VideoRecorderOnboardingProps {
  onVideoRecorded?: (file: Blob) => void;
  prompt?: string;
  setIsEditingVideo?: (isEditing: boolean) => void;
  isCancelButtonVisible?: boolean;
  isInline?: boolean;
}

const VideoRecorderOnboarding: React.FC<VideoRecorderOnboardingProps> = (props) => {
  return <VideoRecorder {...props} isInline={props.isInline ?? true} />;
};

export default VideoRecorderOnboarding;