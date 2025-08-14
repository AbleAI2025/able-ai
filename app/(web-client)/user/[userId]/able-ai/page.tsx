"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Clock, DollarSign } from "lucide-react";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import Loader from "@/app/components/shared/Loader";

// Typing indicator component - reusing from onboarding
const TypingIndicator: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    padding: '12px 16px', 
    color: 'var(--secondary-color)', 
    fontWeight: 600,
    animation: 'slideIn 0.3s ease-out',
    opacity: 0,
    animationFillMode: 'forwards'
  }}>
    <div style={{ 
      display: 'flex', 
      gap: '4px',
      background: 'rgba(126, 238, 249, 0.1)',
      padding: '8px 12px',
      borderRadius: '20px',
      border: '1px solid rgba(126, 238, 249, 0.2)'
    }}>
      <span className="typing-dot" style={{ 
        animation: 'typingBounce 1.4s infinite ease-in-out',
        fontSize: '18px',
        lineHeight: '1'
      }}>●</span>
      <span className="typing-dot" style={{ 
        animation: 'typingBounce 1.4s infinite ease-in-out 0.2s',
        fontSize: '18px',
        lineHeight: '1'
      }}>●</span>
      <span className="typing-dot" style={{ 
        animation: 'typingBounce 1.4s infinite ease-in-out 0.4s',
        fontSize: '18px',
        lineHeight: '1'
      }}>●</span>
    </div>
    <style>{`
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes typingBounce {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-8px);
          opacity: 1;
        }
      }
    `}</style>
  </div>
);

// Gig Card Component
const GigCard: React.FC<{
  title: string;
  location: string;
  price: number;
  date: string;
  description: string;
}> = ({ title, location, price, date, description }) => (
  <div className={pageStyles.gigCard}>
    <div className={pageStyles.gigTitle}>{title}</div>
    <div className={pageStyles.gigDetails}>
      <div className={pageStyles.gigDetail}>
        <MapPin className={pageStyles.gigIcon} />
        <span>{location}</span>
      </div>
      <div className={pageStyles.gigDetail}>
        <DollarSign className={pageStyles.gigIcon} />
        <span>£{price}/hour</span>
      </div>
      <div className={pageStyles.gigDetail}>
        <Clock className={pageStyles.gigIcon} />
        <span>{date}</span>
      </div>
    </div>
    <div className={pageStyles.gigDescription}>{description}</div>
  </div>
);

import pageStyles from "./AbleAIPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { useFirebase } from '@/context/FirebaseContext';
import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';

type ChatStep = {
  id: number;
  type: "bot" | "user" | "typing";
  content?: string;
  isNew?: boolean;
  gigs?: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    price: number;
    date: string;
  }>;
};

interface AIResponse {
  response: string;
  hasGigs?: boolean;
  gigs?: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    price: number;
    date: string;
  }>;
  needsLiveAgent?: boolean;
}

export default function AbleAIPage() {
  const { user, loading: loadingAuth } = useAuth();
  const { ai } = useFirebase();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([{
    id: 1,
    type: "bot",
    content: "Hello! I'm Able, your AI assistant! 🤖 I'm here to help you find gigs, answer questions, and provide support. You can ask me about available gigs, how the platform works, or request help with anything else. What can I help you with today?",
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackTargetId, setFeedbackTargetId] = useState<number | null>(null);
  const [feedbackPending, setFeedbackPending] = useState<boolean>(false);
  const [notHelpfulCount, setNotHelpfulCount] = useState<number>(0);
  const [escalated, setEscalated] = useState<boolean>(false);

  const SUPPORT_EMAIL = 'support@ableai.com';

  // AI response handler
  const handleAIResponse = useCallback(async (userMessage: string) => {
    if (!ai) {
      setError('AI service temporarily unavailable. Please try again.');
      return;
    }

    try {
      // Add typing indicator
      setChatSteps(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "typing",
          isNew: true,
        },
      ]);

      const responseSchema = Schema.object({
        properties: {
          response: Schema.string(),
          hasGigs: Schema.boolean(),
          gigs: Schema.array({
            items: Schema.object({
              properties: {
                id: Schema.string(),
                title: Schema.string(),
                description: Schema.string(),
                location: Schema.string(),
                price: Schema.number(),
                date: Schema.string(),
              },
            }),
          }),
          needsLiveAgent: Schema.boolean(),
        },
      });

      const prompt = `You are Able, an AI assistant for a gig platform. Your role is to help users find gigs, answer questions about the platform, and provide support.

User message: "${userMessage}"

Please respond appropriately based on the user's request:

1. If they're asking about available gigs, search the database and provide relevant gigs
2. If they need help with the platform, provide helpful guidance
3. If they request a live agent, set needsLiveAgent to true
4. Be friendly, helpful, and professional

For gigs, include relevant details like title, description, location, price, and date.
For platform help, provide clear, actionable advice.

Respond with a helpful message and include any relevant gigs if applicable.`;

      const result = await geminiAIAgent(
        "gemini-2.0-flash",
        {
          prompt,
          responseSchema,
          isStream: false,
        },
        ai
      );

      if (result.ok && result.data) {
        const aiResponse = result.data as AIResponse;
        
        // Remove typing indicator and add AI response
        setTimeout(() => {
          setChatSteps(prev => {
            const filtered = prev.filter(s => s.type !== 'typing');
            
            let responseContent = aiResponse.response;
            
            // If live agent is needed, add a note
            if (aiResponse.needsLiveAgent) {
              responseContent += '\n\n*Note: For more complex issues, you can request a live agent.*';
              // TODO: Implement live agent redirect logic here
            }

            const newMessage: ChatStep = {
              id: Date.now() + 2,
              type: "bot",
              content: responseContent,
              gigs: aiResponse.gigs,
              isNew: true,
            };

            const next = [
              ...filtered,
              newMessage,
            ];

            // After any AI response, show feedback prompt unless escalated
            setFeedbackTargetId(newMessage.id);
            setFeedbackPending(true);
            setEscalated(false);

            return next;
          });
        }, 700);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError('Failed to get response. Please try again.');
      
      // Remove typing indicator and add error message
      setTimeout(() => {
        setChatSteps(prev => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 2,
              type: "bot",
              content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
              isNew: true,
            },
          ];
        });
      }, 700);
    }
  }, [ai]);

  const handleHelpful = useCallback(() => {
    if (!feedbackPending) return;
    setFeedbackPending(false);
    setNotHelpfulCount(0);
    setChatSteps(prev => ([
      ...prev,
      {
        id: Date.now() + 3,
        type: 'bot',
        content: 'Thanks for the feedback! If you have more questions, I\'m here to help.',
        isNew: true,
      },
    ]));
  }, [feedbackPending]);

  const handleNotHelpful = useCallback(() => {
    if (!feedbackPending) return;
    const nextCount = notHelpfulCount + 1;
    setNotHelpfulCount(nextCount);
    setFeedbackPending(false);

    if (nextCount >= 4) {
      setEscalated(true);
      setChatSteps(prev => ([
        ...prev,
        {
          id: Date.now() + 4,
          type: 'bot',
          content: `I\'m sorry I couldn\'t resolve this. I\'m escalating to human support. Please email us at ${SUPPORT_EMAIL} or compose an email here: mailto:${SUPPORT_EMAIL}`,
          isNew: true,
        },
      ]));
      return;
    }

    // Ask for clarification and continue the loop
    setChatSteps(prev => ([
      ...prev,
      {
        id: Date.now() + 5,
        type: 'bot',
        content: 'Sorry about that. Could you share a bit more detail so I can better assist?',
        isNew: true,
      },
    ]));

    // Re-show feedback for the next AI turn
    setTimeout(() => {
      setFeedbackPending(true);
    }, 0);
  }, [feedbackPending, notHelpfulCount]);

  // Handle sending messages
  const onSendMessage = useCallback((message: string) => {
    // Add user message
    setChatSteps(prev => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        content: message,
        isNew: true,
      },
    ]);

    // Get AI response
    handleAIResponse(message);
  }, [handleAIResponse]);

  // Auto-scroll to the bottom whenever chatSteps changes
  useEffect(() => {
    if (endOfChatRef.current) {
      endOfChatRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatSteps]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    <ChatBotLayout 
      ref={chatContainerRef} 
      className={pageStyles.container} 
      role="BUYER"
      showChatInput={true}
      onSendMessage={onSendMessage}
    >
      {error && (
        <div style={{ 
          background: '#ff4444', 
          color: 'white', 
          padding: '8px 16px', 
          margin: '8px 0', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      {chatSteps.map((step, idx) => {
        const key = step.id;
        
        if (step.type === "typing") {
          return (
            <div key={key}>
              {/* AI Avatar - Separated */}
              <div key={`${key}-avatar`} style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--secondary-color), var(--secondary-darker-color))',
                    boxShadow: '0 2px 8px rgba(126, 238, 249, 0.3)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Image 
                        src="/images/ableai.png" 
                        alt="Able AI" 
                        width={24} 
                        height={24} 
                        style={{
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Typing Indicator - Separated */}
              <div key={`${key}-typing`}>
                <TypingIndicator />
              </div>
            </div>
          );
        }
        
        if (step.type === "bot") {
          return (
            <div key={key}>
              <MessageBubble
                text={step.content as string}
                senderType="bot"
                isNew={step.isNew}
                role="BUYER"
              />
              {/* Render gig cards if available */}
              {step.gigs && step.gigs.length > 0 && (
                <div style={{ marginTop: '8px', marginLeft: '40px' }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: 'var(--secondary-color)', 
                    marginBottom: '12px' 
                  }}>
                    Available Gigs:
                  </div>
                  {step.gigs.map((gig, gigIndex) => (
                    <GigCard
                      key={gig.id || gigIndex}
                      title={gig.title}
                      location={gig.location}
                      price={gig.price}
                      date={gig.date}
                      description={gig.description}
                    />
                  ))}
                </div>
              )}
              {feedbackPending && feedbackTargetId === step.id && !escalated && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: '40px',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-color)' }}>Was this helpful?</span>
                  <button
                    type="button"
                    onClick={handleHelpful}
                    style={{
                      padding: '6px 10px',
                      background: 'var(--secondary-color)',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >Helpful</button>
                  <button
                    type="button"
                    onClick={handleNotHelpful}
                    style={{
                      padding: '6px 10px',
                      background: 'transparent',
                      color: 'var(--secondary-color)',
                      border: '1px solid var(--secondary-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >Not helpful</button>
                </div>
              )}
            </div>
          );
        }
        
        if (step.type === "user") {
          return (
            <MessageBubble
              key={key}
              text={typeof step.content === 'object' && step.content !== null ? JSON.stringify(step.content) : String(step.content || '')}
              senderType="user"
              showAvatar={false}
              isNew={step.isNew}
              role="BUYER"
            />
          );
        }
        
        return null;
      })}
      
      <div ref={endOfChatRef} />
    </ChatBotLayout>
  );
}

// TODO: Database integration - connect to real gig database
// TODO: Live agent - implement live agent redirect and chat system
// TODO: Filtering - add gig filtering by location, price, date, category
