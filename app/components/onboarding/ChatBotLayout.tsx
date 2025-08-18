import React, { ReactNode } from 'react';
import styles from './ChatBotLayout.module.css';
import Logo from '../brand/Logo';
import TextAreaBubble from './TextAreaBubble';
import ChatInput from './ChatInput';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ScreenHeaderWithBack from '../layout/ScreenHeaderWithBack';
import OnboardingOptionsDropdown from './OnboardingOptionsDropdown';

interface ChatBotLayoutProps {
  children: ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
  onHomeClick?: () => void;
  onSendMessage?: (message: string) => void;
  role?: 'BUYER' | 'GIG_WORKER';
  showChatInput?: boolean;
  showOnboardingOptions?: boolean;
  onSwitchToManual?: () => void;
  onChangeSetupMethod?: () => void;
}

const ChatBotLayout = React.forwardRef<HTMLDivElement, ChatBotLayoutProps>(
  ({ children, onScroll, className, onHomeClick, onSendMessage, role = 'GIG_WORKER', showChatInput = false, showOnboardingOptions = false, onSwitchToManual, onChangeSetupMethod }, ref) => {

    const router = useRouter();
    const { user } = useAuth();
    const onHomeClickInternal = () => {
      router.push(`/user/${user?.uid}/worker`);
    }

    const handleSendMessage = (message: string) => {
      if (onSendMessage) {
        onSendMessage(message);
      }
    };

    return (
      <div className={`${styles.chatContainerWrapper} ${className}`}>
        <div className={styles.chatContainer} onScroll={onScroll} ref={ref}>
          <ScreenHeaderWithBack onBackClick={() => router.back()} />
          <div className={styles.chatContent}>
            {showOnboardingOptions && onSwitchToManual && onChangeSetupMethod && (
              <div className={styles.onboardingOptionsContainer}>
                <OnboardingOptionsDropdown
                  onSwitchToManual={onSwitchToManual}
                  onChangeSetupMethod={onChangeSetupMethod}
                />
              </div>
            )}
            {children}
          </div>
          {showChatInput && (
            <ChatInput 
              onSend={handleSendMessage}
              role={role}
              placeholder="Type your message..."
            />
          )}
        </div>
      </div>
    );
  }
);

ChatBotLayout.displayName = 'ChatBotLayout';
export default ChatBotLayout;