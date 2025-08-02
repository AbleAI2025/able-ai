"use client";

import React from 'react';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  text: React.ReactNode;
  senderType: 'user' | 'bot';
  showAvatar?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, senderType }) => {
  return (
    <div className={`${styles.bubbleWrapper} ${styles[`align${senderType === 'bot' ? 'Bot' : 'User'}`]}`}>
      <div className={`${styles.bubble} ${styles[`${senderType}Bubble`]}`}>
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;
