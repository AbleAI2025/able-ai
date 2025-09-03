"use client";

import React, { useState, useEffect } from "react";
import MessageBubble from "./MessageBubble"; 
import styles from "./DiscountCodeBubble.module.css";

interface DiscountCodeBubbleProps {
  sessionCode: string | null;
  onConfirm: (code: string | null) => void;
  role: "BUYER" | "GIG_WORKER";
}

const DiscountCodeBubble: React.FC<DiscountCodeBubbleProps> = ({ sessionCode, onConfirm, role}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('edit');
  const [inputValue, setInputValue] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (sessionCode && !isConfirmed) {
      setMode('view');
      setInputValue(sessionCode);
    }
  }, [sessionCode, isConfirmed]);

  const handleConfirm = (codeToConfirm: string | null) => {
    if (isConfirmed) return;
    setIsConfirmed(true);
    const finalCode = codeToConfirm?.trim().toUpperCase() || null;
    onConfirm(finalCode);
  };

  const renderContent = () => {
    if (isConfirmed) {
      const confirmedCode = inputValue.trim().toUpperCase();
      return <div className={styles.confirmedMessage}>{confirmedCode ? `Discount code "${confirmedCode}" applied.` : "No discount code applied."}</div>;
    }

    if (mode === 'view' && sessionCode) {
      return (
        <div>
          <p className={styles.promptTextLargeMargin}>
            We found a referral code: <strong>{sessionCode}</strong>
          </p>
          <div className={styles.buttonContainer}>
            <button className={`${styles.bubbleButton} ${styles.primary}`} onClick={() => handleConfirm(sessionCode)}>
              Use this code
            </button>
            <button className={`${styles.bubbleButton} ${styles.secondary}`} onClick={() => {
              setMode('edit');
              setInputValue('');
            }}>
              Enter another
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className={styles.promptText}>Do you have a different discount code? Enter it below or skip.</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g., ABLE20"
          className={styles.codeInput}
        />
        <div className={styles.buttonContainer}>
          <button className={`${styles.bubbleButton} ${styles.primary}`} onClick={() => handleConfirm(inputValue)}>
            Apply Code
          </button>
          <button className={`${styles.bubbleButton} ${styles.secondary}`} onClick={() => handleConfirm(null)}>
            Skip
          </button>
        </div>
      </div>
    );
  };

  return (
    <MessageBubble
      text={renderContent()}
      senderType="bot"
      role={role}
      showAvatar={true}
    />
  );
};

export default DiscountCodeBubble;
