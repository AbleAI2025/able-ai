import React, { ReactNode, memo } from 'react';
import styles from './MessageBubble.module.css';
import Image from 'next/image';

interface MessageBubbleProps {
  text: ReactNode;
  senderType?: 'bot' | 'user';
  avatarSrc?: string;
  showAvatar?: boolean;
  isNew?: boolean; // Track if this message is new for animation
  role?: 'BUYER' | 'GIG_WORKER';
}

const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  text,
  senderType = 'bot',
  avatarSrc,
  showAvatar = true,
  isNew = false,
  role = 'GIG_WORKER'
}) => {
  const isBot = senderType === 'bot';
  const bubbleClass = isBot ? styles.bubbleBot : styles.bubbleUser;
  const alignmentClass = isBot ? styles.alignBot : styles.alignUser;
  const animationClass = isNew ? styles.messageWrapperNew : '';

  return (
    <div className={`${styles.messageWrapper} ${alignmentClass} ${animationClass}`} data-role={role}>
      {isBot && showAvatar && (
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            <div className={styles.avatarInner}>
              <Image 
                src="/images/ableai.png" 
                alt="Able AI" 
                width={24} 
                height={24} 
                className={styles.avatarImage}
              />
            </div>
          </div>
        </div>
      )}
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {text}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;