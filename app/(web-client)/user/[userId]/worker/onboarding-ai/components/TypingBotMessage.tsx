import React from 'react';
import Image from 'next/image';
import styles from '../OnboardingAIPage.module.css';

interface TypingBotMessageProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
  showAvatar?: boolean;
}

/**
 * Typing animation component for bot messages
 */
const TypingBotMessage: React.FC<TypingBotMessageProps> = ({ text, onComplete, speed = 30, showAvatar = true }) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(true);

  React.useEffect(() => {
    if (!text) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        if (onComplete) {
          setTimeout(onComplete, 500); // Small delay before calling onComplete
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <div className={styles.typingBotMessageContainer}>
      {showAvatar && (
        <div className={styles.typingBotAvatarContainer}>
          <div className={styles.typingBotAvatar}>
            <div className={styles.typingBotAvatarInner}>
              <Image 
                src="/images/ableai.png" 
                alt="Able AI" 
                width={24} 
                height={24} 
                className={styles.typingBotAvatarImage}
              />
            </div>
          </div>
        </div>
      )}
      <div className={`bubble bubbleBot ${styles.typingBotBubble}`}>
        {displayedText}
        {isTyping && (
          <span className={styles.typingBotCursor}></span>
        )}
      </div>
    </div>
  );
};

export default TypingBotMessage;
