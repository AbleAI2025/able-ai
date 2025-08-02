import React, { ReactNode } from 'react';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  text: ReactNode;
  senderType?: 'bot' | 'user';
  avatarSrc?: string; // Made optional as user bubbles might not have it
  showAvatar?: boolean;
  isNew?: boolean; // Track if this message is new for animation
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  senderType = 'bot',
  isNew = false,
}) => {
  const isBot = senderType === 'bot';
  const bubbleClass = isBot ? styles.bubbleBot : styles.bubbleUser;
  const alignmentClass = isBot ? styles.alignBot : styles.alignUser;
  const animationClass = isNew ? styles.messageWrapperNew : '';

  return (
    <div className={`${styles.messageWrapper} ${alignmentClass} ${animationClass}`}>
      {/* {isBot && showAvatar && avatarSrc && (
        <Image src={avatarSrc} alt="Bot Avatar" width={32} height={32} className={`${styles.avatar} ${chatStyles.avatarWithBorder}`} />
      )}
      {!isBot && avatarSrc && showAvatar && ( // Optional: Allow user avatar if src is provided
         <Image src={avatarSrc} alt="User Avatar" width={32} height={32} className={`${styles.avatar} ${chatStyles.avatarWithBorder}`} />
      )} */}
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;