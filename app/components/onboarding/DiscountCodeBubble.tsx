"use client";

import React, { useState, useEffect } from "react";
import MessageBubble from "./MessageBubble"; 

interface DiscountCodeBubbleProps {
  sessionCode: string | null;
  onConfirm: (code: string | null) => void;
  role: "BUYER" | "WORKER";
}

const DiscountCodeBubble: React.FC<DiscountCodeBubbleProps> = ({ sessionCode, onConfirm}) => {
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
      return <div style={{ color: '#aaa' }}>{confirmedCode ? `Discount code "${confirmedCode}" applied.` : "No discount code applied."}</div>;
    }

    if (mode === 'view' && sessionCode) {
      return (
        <div>
          <p style={{ margin: '0 0 16px' }}>
            We found a referral code: <strong>{sessionCode}</strong>
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="bubble-button primary" onClick={() => handleConfirm(sessionCode)}>
              Use this code
            </button>
            <button className="bubble-button secondary" onClick={() => {
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
        <p style={{ margin: '0 0 12px' }}>Do you have a different discount code? Enter it below or skip.</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g., ABLE20"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #444',
            background: '#222',
            color: '#fff',
            fontSize: '15px',
            marginBottom: '12px'
          }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="bubble-button primary" onClick={() => handleConfirm(inputValue)}>
            Apply Code
          </button>
          <button className="bubble-button secondary" onClick={() => handleConfirm(null)}>
            Skip
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* ... styles are unchanged ... */
        .bubble-button {
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bubble-button.primary {
          background: var(--secondary-color);
          color: #000;
        }
        .bubble-button.primary:hover {
          background: var(--secondary-darker-color);
        }
        .bubble-button.secondary {
          background: transparent;
          color: var(--secondary-color);
          border: 1px solid var(--secondary-color);
        }
         .bubble-button.secondary:hover {
          background: var(--secondary-color);
          color: #000;
        }
      `}</style>
      <MessageBubble
        text={renderContent()}
        senderType="bot"
        role={"BUYER"}
        showAvatar={true}
      />
    </>
  );
};

export default DiscountCodeBubble;
