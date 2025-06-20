import React, { ReactNode } from 'react';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  text: ReactNode;
  senderType?: 'bot' | 'user';
  avatarSrc?: string; // Made optional as user bubbles might not have it
  showAvatar?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  senderType = 'bot',
}) => {
  const isBot = senderType === 'bot';
  const bubbleClass = isBot ? styles.bubbleBot : styles.bubbleUser;
  const alignmentClass = isBot ? styles.alignBot : styles.alignUser;

  return (
    <div className={`${styles.messageWrapper} ${alignmentClass}`}>
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