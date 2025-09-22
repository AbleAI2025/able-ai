/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, ArrowLeft, User, Briefcase, X, Calendar, Clock, MapPin, DollarSign } from "lucide-react";

import Loader from "@/app/components/shared/Loader";

import pageStyles from "./WorkerChatPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { getWorkerOffers } from "@/actions/gigs/get-worker-offers";

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "BUYER" | "WORKER";
  content: string;
  timestamp: Date;
  isNew?: boolean;
  avatar?: string;
};

type ChatParticipant = {
  id: string;
  name: string;
  role: "BUYER" | "WORKER";
  avatar?: string;
};

type WorkerGigOffer = {
  id: string;
  role: string;
  buyerName: string;
  locationSnippet: string;
  dateString: string;
  timeString: string;
  hourlyRate: number;
  estimatedHours?: number;
  totalPay?: number;
  tipsExpected?: boolean;
  expiresAt?: string;
  status: string;
  fullDescriptionLink?: string;
  gigDescription?: string;
  notesForWorker?: string;
};

export default function WorkerChatPage() {
  const { user, loading: loadingAuth } = useAuth();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  
  // State for gigs and modal
  const [gigs, setGigs] = useState<WorkerGigOffer[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [selectedGig, setSelectedGig] = useState<WorkerGigOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Placeholder participants
  const [participants] = useState<ChatParticipant[]>([
    {
      id: "alex-123",
      name: "Benji",
      role: "WORKER",
      avatar: "/images/benji.jpeg",
    },
    {
      id: "maria-456", 
      name: "Maria",
      role: "BUYER",
      avatar: "/images/jessica.jpeg",
    }
  ]);

  // Placeholder chat messages for worker perspective
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderId: "maria-456",
      avatar: "/images/jessica.jpeg",
      senderName: "Maria",
      senderRole: "BUYER",
      content: "Hi Benji, I saw your profile and I'm interested in hiring you for a photography gig this weekend. Are you available?",
      timestamp: new Date(Date.now() - 600000),
    },
    {
      id: "2",
      senderId: "alex-123",
      senderName: "Alex", 
      senderRole: "WORKER",
      content: "Hello Maria! Yes, I'm available this weekend. I'd love to hear more about your photography needs. What type of event is it?",
      timestamp: new Date(Date.now() - 480000),
    },
    {
      id: "3",
      senderId: "maria-456",
      senderName: "Maria",
      senderRole: "BUYER", 
      content: "It's a small wedding ceremony in the park. I need someone to capture the ceremony and some portraits. What's your rate?",
      timestamp: new Date(Date.now() - 480000),
    },
    {
      id: "4",
      senderId: "alex-123",
      senderName: "Alex",
      senderRole: "WORKER", 
      content: "That sounds lovely! For a wedding ceremony and portraits, my rate is £150 for 3 hours. I'll provide edited photos within 48 hours. Does that work for you?",
      timestamp: new Date(Date.now() - 120000),
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get current user's role (assuming they're the worker)
  const currentUser = participants.find(p => p.id === user?.uid) || participants[0];
  const otherParticipant = participants.find(p => p.id !== currentUser.id) || participants[1];

  // Fetch gigs from database
  useEffect(() => {
    const fetchGigs = async () => {
      if (!user?.uid) return;
      
      try {
        setLoadingGigs(true);
        const result = await getWorkerOffers(user.uid);
        
        if (result.success && result.data) {
          // Get first 3 gigs (offers first, then accepted)
          const allGigs = [...result.data.offers, ...result.data.acceptedGigs];
          setGigs(allGigs.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching gigs:', error);
      } finally {
        setLoadingGigs(false);
      }
    };

    fetchGigs();
  }, [user?.uid]);

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

  // Handle gig click
  const handleGigClick = (gig: WorkerGigOffer) => {
    setSelectedGig(gig);
    setIsModalOpen(true);
  };

  // Handle go to gig offers
  const handleGoToGigOffers = () => {
    if (user?.uid) {
      router.push(`/user/${user.uid}/worker/offers`);
    }
    setIsModalOpen(false);
  };

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

      {/* Available Gigs Section */}
      <div className={pageStyles.gigsSection}>
        <h3 className={pageStyles.gigsSectionTitle}>Available Gigs</h3>
        {loadingGigs ? (
          <div className={pageStyles.gigsLoading}>Loading gigs...</div>
        ) : gigs.length > 0 ? (
          <div className={pageStyles.gigsGrid}>
            {gigs.map((gig) => (
              <div 
                key={gig.id} 
                className={pageStyles.gigCard}
                onClick={() => handleGigClick(gig)}
              >
                <div className={pageStyles.gigHeader}>
                  <h4 className={pageStyles.gigTitle}>{gig.role}</h4>
                  <span className={pageStyles.gigStatus}>{gig.status}</span>
                </div>
                <div className={pageStyles.gigDetails}>
                  <div className={pageStyles.gigDetail}>
                    <MapPin size={14} />
                    <span>{gig.locationSnippet}</span>
                  </div>
                  <div className={pageStyles.gigDetail}>
                    <Calendar size={14} />
                    <span>{gig.dateString}</span>
                  </div>
                  <div className={pageStyles.gigDetail}>
                    <Clock size={14} />
                    <span>{gig.timeString}</span>
                  </div>
                  <div className={pageStyles.gigDetail}>
                    <DollarSign size={14} />
                    <span>£{gig.hourlyRate}/hr</span>
                  </div>
                </div>
                {gig.estimatedHours && (
                  <div className={pageStyles.gigTotal}>
                    <span>Total: £{gig.totalPay} ({gig.estimatedHours}h)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={pageStyles.noGigs}>No gigs available at the moment</div>
        )}
      </div>

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

      {/* Gig Detail Modal */}
      {isModalOpen && selectedGig && (
        <div className={pageStyles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={pageStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={pageStyles.modalHeader}>
              <h3>{selectedGig.role}</h3>
              <button 
                className={pageStyles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={pageStyles.modalBody}>
              <div className={pageStyles.modalGigDetails}>
                <div className={pageStyles.modalGigDetail}>
                  <MapPin size={16} />
                  <span>{selectedGig.locationSnippet}</span>
                </div>
                <div className={pageStyles.modalGigDetail}>
                  <Calendar size={16} />
                  <span>{selectedGig.dateString}</span>
                </div>
                <div className={pageStyles.modalGigDetail}>
                  <Clock size={16} />
                  <span>{selectedGig.timeString}</span>
                </div>
                <div className={pageStyles.modalGigDetail}>
                  <DollarSign size={16} />
                  <span>£{selectedGig.hourlyRate}/hr</span>
                </div>
                {selectedGig.estimatedHours && (
                  <div className={pageStyles.modalGigDetail}>
                    <span>Total: £{selectedGig.totalPay} ({selectedGig.estimatedHours}h)</span>
                  </div>
                )}
              </div>
              {selectedGig.gigDescription && (
                <div className={pageStyles.modalDescription}>
                  <h4>Description</h4>
                  <p>{selectedGig.gigDescription}</p>
                </div>
              )}
              {selectedGig.notesForWorker && (
                <div className={pageStyles.modalNotes}>
                  <h4>Notes for Worker</h4>
                  <p>{selectedGig.notesForWorker}</p>
                </div>
              )}
            </div>
            <div className={pageStyles.modalFooter}>
              <button 
                className={pageStyles.goToOffersButton}
                onClick={handleGoToGigOffers}
              >
                Go to Gig Offers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 