"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, ArrowLeft, User, Briefcase } from "lucide-react";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import Loader from "@/app/components/shared/Loader";

import pageStyles from "./ChatPage.module.css";
import { useAuth } from "@/context/AuthContext";

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "BUYER" | "WORKER";
  content: string;
  timestamp: Date;
  isNew?: boolean;
};

type ChatParticipant = {
  id: string;
  name: string;
  role: "BUYER" | "WORKER";
  avatar?: string;
};

export default function ChatPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  
  // Placeholder participants
  const [participants] = useState<ChatParticipant[]>([
    {
      id: "benji-123",
      name: "Benji",
      role: "WORKER"
    },
    {
      id: "sue-456", 
      name: "Sue",
      role: "BUYER"
    }
  ]);

  // Placeholder chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderId: "benji-123",
      senderName: "Benji",
      senderRole: "WORKER",
      content: "Hi! I just wanted to confirm the details of our gig. Could you let me know if there's anything specific you'd like me to focus on?",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      id: "2",
      senderId: "sue-456",
      senderName: "Sue", 
      senderRole: "BUYER",
      content: "Hello! Yes, please focus on the main tasks as outlined in the gig detail. Let me know if you have any questions.",
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
    },
    {
      id: "3",
      senderId: "benji-123",
      senderName: "Benji",
      senderRole: "WORKER", 
      content: "Great! I look forward to working with you. I've started on it right away. Thank you for the clarification.",
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get current user's role (assuming they're one of the participants)
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
          <ArrowLeft size={20} />
        </button>
        <div className={pageStyles.headerContent}>
          <div className={pageStyles.participantInfo}>
            <div className={pageStyles.avatar}>
              {otherParticipant.avatar ? (
                <Image 
                  src={otherParticipant.avatar} 
                  alt={otherParticipant.name}
                  width={40}
                  height={40}
                  className={pageStyles.avatarImage}
                />
              ) : (
                <div className={pageStyles.avatarPlaceholder}>
                  {otherParticipant.name.charAt(0)}
                </div>
              )}
            </div>
            <div className={pageStyles.participantDetails}>
              <h2 className={pageStyles.participantName}>{otherParticipant.name}</h2>
              <div className={pageStyles.participantRoleContainer}>
                {getRoleIcon(otherParticipant.role)}
                <p className={pageStyles.participantRole}>
                  {otherParticipant.role === "BUYER" ? "Buyer" : "Worker"}
                </p>
              </div>
            </div>
          </div>
        </div>
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
              {/* Only show avatar for messages from other people */}
              {!isCurrentUser && (
                <div className={pageStyles.avatar}>
                  <div className={pageStyles.avatarPlaceholder}>
                    {participant?.name.charAt(0).toUpperCase() || "U"}
                  </div>
                </div>
              )}
              
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
          <div className={pageStyles.avatar}>
            <div className={pageStyles.avatarPlaceholder}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <input
            type="text"
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