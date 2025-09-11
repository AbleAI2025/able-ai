"use client";
import React from "react";
import VideoRecorder from "./VideoRecorder";

interface VideoRecorderBubbleProps {
  onVideoRecorded?: (file: Blob) => void;
  prompt?: string;
  setIsEditingVideo?: (isEditing: boolean) => void;
  isCancelButtonVisible?: boolean;
}

const VideoRecorderBubble: React.FC<VideoRecorderBubbleProps> = (props) => {
  return <VideoRecorder {...props} isInline={false} />;
};

export default VideoRecorderBubble;
