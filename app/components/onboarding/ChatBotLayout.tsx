import React, { ReactNode } from "react";
import ChatInput from "./ChatInput";
import ScreenHeaderWithBack from "../layout/ScreenHeaderWithBack";
import OnboardingOptionsDropdown from "./OnboardingOptionsDropdown";
import styles from "./ChatBotLayout.module.css";

interface ChatBotLayoutProps {
  children: ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  className?: string;
  onHomeClick?: () => void;
  onSendMessage?: (message: string) => void;
  role?: "BUYER" | "GIG_WORKER";
  showChatInput?: boolean;
  disableChatInput?: boolean;
  showOnboardingOptions?: boolean;
  onSwitchToManual?: () => void;
  onChangeSetupMethod?: () => void;
}

const ChatBotLayout = React.forwardRef<HTMLDivElement, ChatBotLayoutProps>(
  (
    {
      children,
      onScroll,
      className,
      onSendMessage,
      role = "GIG_WORKER",
      showChatInput = false,
      disableChatInput = false,
      showOnboardingOptions = false,
      onSwitchToManual,
      onChangeSetupMethod,
    },
    ref
  ) => {
    const handleSendMessage = (message: string) => {
      if (onSendMessage) {
        onSendMessage(message);
      }
    };

    return (
      <div className={`${styles.chatContainerWrapper} ${className}`}>
        <div className={styles.chatContainer} onScroll={onScroll} ref={ref}>
          <ScreenHeaderWithBack />
          <div className={styles.chatContent}>
            {showOnboardingOptions &&
              onSwitchToManual &&
              onChangeSetupMethod && (
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
              disabled={disableChatInput}
            />
          )}
        </div>
      </div>
    );
  }
);

ChatBotLayout.displayName = "ChatBotLayout";
export default ChatBotLayout;
