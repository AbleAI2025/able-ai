"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AbleAIPage.module.css';

const QAModeIndicator: React.FC = () => {
  const [isQaMode, setIsQaMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Reading from localStorage should be done in useEffect to avoid SSR issues.
    setIsQaMode(localStorage.getItem('isViewQA') === 'true');
  }, []);

  const handleDisable = () => {
    localStorage.setItem('isViewQA', 'false');
    // Consider replacing this with a less disruptive update mechanism,
    // such as `router.refresh()` or by triggering a data refetch via state.
    router.refresh();
  };

  return (
    <div className={styles.qaIndicator}>
      <span>QA Mode: {isQaMode ? 'ON' : 'OFF'}</span>
      {isQaMode && (
        <button
          onClick={handleDisable}
          className={styles.disableQAButton}
        >
          Disable QA Mode
        </button>
      )}
    </div>
  );
};

export default QAModeIndicator;