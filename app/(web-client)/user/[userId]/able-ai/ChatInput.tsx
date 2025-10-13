"use client";

import React from 'react';
import { Eye } from 'lucide-react';
import styles from './AbleAIPage.module.css';

const ChatInput: React.FC = () => {
  return (
    <div className={styles.chatInput}>
      <div className={styles.userAvatar}>
        <span>N</span>
      </div>
      <input
        type="text"
        placeholder="Type your message..."
        className={styles.messageInput}
      />
      <button className={styles.sendButton}>
        <Eye size={16} />
      </button>
    </div>
  );
};

export default ChatInput;