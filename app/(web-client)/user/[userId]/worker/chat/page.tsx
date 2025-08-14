/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, ArrowLeft, User, Briefcase } from "lucide-react";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import Loader from "@/app/components/shared/Loader";

import pageStyles from "./WorkerChatPage.module.css";
import { useAuth } from "@/context/AuthContext";

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "BUYER" | "WORKER";
  content: string;
  timestamp: Date;
  isNew?: boolean;
  avatar?: string; // Optional avatar for the sender
};

type ChatParticipant = {
  id: string;
  name: string;
  role: "BUYER" | "WORKER";
  avatar?: string;
};

export default function WorkerChatPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  
  // Placeholder participants
  const [participants] = useState<ChatParticipant[]>([
    {
      id: "alex-123",
      name: "Benji",
      role: "WORKER",
      avatar: "/images/benji.jpeg", // Placeholder image
    },
    {
      id: "maria-456", 
      name: "Maria",
      role: "BUYER",
      avatar: "/images/jessica.jpeg", // Placeholder image
    }
  ]);

  // Placeholder chat messages for worker perspective
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderId: "maria-456",
      avatar: "/images/jessica.jpeg", // Placeholder image
      senderName: "Maria",
      senderRole: "BUYER",
      content: "Hi Benji, I saw your profile and I'm interested in hiring you for a photography gig this weekend. Are you available?",
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    },
    {
      id: "2",
      senderId: "alex-123",
      senderName: "Alex", 
      senderRole: "WORKER",
      content: "Hello Maria! Yes, I'm available this weekend. I'd love to hear more about your photography needs. What type of event is it?",
      timestamp: new Date(Date.now() - 480000), // 8 minutes ago
    },
    {
      id: "3",
      senderId: "maria-456",
      senderName: "Maria",
      senderRole: "BUYER", 
      content: "It's a small wedding ceremony in the park. I need someone to capture the ceremony and some portraits. What's your rate?",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      id: "4",
      senderId: "alex-123",
      senderName: "Alex",
      senderRole: "WORKER", 
      content: "That sounds lovely! For a wedding ceremony and portraits, my rate is £150 for 3 hours. I'll provide edited photos within 48 hours. Does that work for you?",
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get current user's role (assuming they're the worker)
  const currentUser = participants.find(p => p.id === user?.uid) || participants[0];
  const otherParticipant = participants.find(p => p.id !== currentUser.id) || participants[1];

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get role icon
  const getRoleIcon = (role: "BUYER" | "WORKER") => {
    return role === "BUYER" ? <User size={16} /> : <Briefcase size={16} />;
  };

  // Handle sending message
  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isSending) return;

    setIsSending(true);

    // Create new message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: message.trim(),
      timestamp: new Date(),
      isNew: true,
    };

    // Add message to chat
    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");

    // Simulate typing delay
    setTimeout(() => {
      setIsSending(false);
    }, 1000);
  }, [currentUser, isSending]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loadingAuth) {
    return (
      <div className={pageStyles.loadingContainer}>
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Loader />;
  }

  return (
    <div className={pageStyles.container}>
      {/* Header */}
      <header className={pageStyles.header}>
        <button 
          onClick={() => router.back()} 
          className={pageStyles.backButton}
          aria-label="Go back"
        >
          <ArrowLeft className={pageStyles.backIcon} />
        </button>
        <h2 className={pageStyles.participantNames}>Chat between {currentUser.name} and {otherParticipant.name}</h2>
      </header>

      {/* Chat Messages */}
      <div className={pageStyles.chatContent} ref={chatContainerRef}>
        {messages.map((message) => {
          // Check if this message is from the current user
          const isCurrentUser = message.senderId === currentUser.id;
          const participant = participants.find(p => p.id === message.senderId);
          
          return (
            <div 
              key={message.id} 
              className={`${pageStyles.messageWrapper} ${
                isCurrentUser ? pageStyles.messageUser : pageStyles.messageOther
              }`}
            >
              <div className={`${pageStyles.avatar} ${isCurrentUser ? pageStyles.currentUserAvatar : ''}`}>
                {/* Display participant avatar or placeholder to the right for the current user */}
                <div className={pageStyles.avatarPlaceholder}>
                  {participant?.avatar ? (
                    <Image
                        src={participant.avatar} 
                        alt={`${participant.name}'s avatar`} 
                        width={40} 
                        height={40} 
                        className={pageStyles.avatarImage}
                      />
                    ) : (
                      participant?.name.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
            
              
              <div className={pageStyles.messageContent}>
                <div className={`${pageStyles.messageBubble} ${
                  isCurrentUser ? pageStyles.bubbleUser : pageStyles.bubbleOther
                }`}>
                  <p className={pageStyles.messageText}>{message.content}</p>
                  <div className={pageStyles.messageFooter}>
                    <span className={pageStyles.messageTime}>
                      {formatTime(message.timestamp)}
                    </span>
                    <div className={pageStyles.messageRole}>
                      {getRoleIcon(message.senderRole)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isSending && (
          <div className={`${pageStyles.messageWrapper} ${pageStyles.messageOther}`}>
            <div className={pageStyles.avatar}>
              <div className={pageStyles.avatarPlaceholder}>
                {otherParticipant.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className={pageStyles.messageContent}>
              <div className={`${pageStyles.messageBubble} ${pageStyles.bubbleOther}`}>
                <div className={pageStyles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={endOfChatRef} />
      </div>

      {/* Chat Input */}
      <div className={pageStyles.chatInput}>
        <div className={pageStyles.inputWrapper}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }
            }}
            placeholder="Type a message..."
            className={pageStyles.input}
            disabled={isSending}
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isSending}
            className={pageStyles.sendButton}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
} 