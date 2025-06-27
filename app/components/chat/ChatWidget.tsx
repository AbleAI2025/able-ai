import React, { useState } from 'react';
import Image from 'next/image';
import styles from './ChatWidget.module.css';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Hello! How can I assist you today?', sender: 'bot', timestamp: new Date() },
    { id: '2', text: "I'm facing an issue with my recent gig.", sender: 'user', timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setMessages(prev => [...prev, { id: String(Date.now()), text: inputText, sender: 'user', timestamp: new Date() }]);
      setInputText('');
      // TODO: Simulate bot response or integrate with actual chat service
    }
  };

  return (
    <div className={styles.chatWidgetCard}>
      <div className={styles.chatHeader}>
        <Image src="/images/ableai.png" alt="Able Bot Avatar" width={40} height={40} className={styles.botAvatar} />
        <h2 className={styles.chatTitle}>Chat with Able</h2>
      </div>
      <div className={styles.messageDisplayArea}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.messageBubble} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className={styles.chatInputContainer}>
        <input
          type="text"
          placeholder="Type your message..."
          className={styles.chatInput}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
      </div>
    </div>
  );
};
export default ChatWidget; 