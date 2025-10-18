"use client";

import React, { useState } from 'react';
import { X, AlertTriangle, Shield, MessageCircle } from 'lucide-react';
import { useIncidentReporting } from '@/hooks/useIncidentReporting';
import { IncidentType } from '@/lib/incident-detection';
import styles from './IncidentReportingModal.module.css';

interface IncidentReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  gigId?: string;
  location?: string;
  userRole?: 'worker' | 'buyer';
  ai: any;
  incidentType: IncidentType;
  initialMessage?: string;
}

export default function IncidentReportingModal({
  isOpen,
  onClose,
  userId,
  gigId,
  location,
  userRole,
  ai,
  incidentType,
  initialMessage
}: IncidentReportingModalProps) {
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    state,
    startIncidentReporting,
    processIncidentInput,
    completeIncidentReporting,
    cancelIncidentReporting
  } = useIncidentReporting({
    userId,
    gigId,
    location,
    userRole,
    ai
  });

  // Start incident reporting when modal opens
  React.useEffect(() => {
    if (isOpen && incidentType && !state.isReporting) {
      startIncidentReporting(incidentType);
    }
  }, [isOpen, incidentType, state.isReporting, startIncidentReporting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await processIncidentInput(userInput.trim());
      setUserInput('');
    } catch (error) {
      console.error('Error processing incident input:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!state.isComplete) return;

    setIsSubmitting(true);
    try {
      // Get token from auth context or localStorage
      const token = localStorage.getItem('authToken') || '';
      await completeIncidentReporting(token);
    } catch (error) {
      console.error('Error completing incident report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancelIncidentReporting();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconContainer}>
              <AlertTriangle className={styles.icon} />
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.title}>Incident Reporting</h2>
              <p className={styles.subtitle}>
                We're here to help you report this {incidentType.replace('_', ' ')} incident safely and confidentially.
              </p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Progress Indicator */}
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${(state.currentStep / state.totalSteps) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>
              Step {state.currentStep} of {state.totalSteps}
            </span>
          </div>

          {/* Conversation History */}
          <div className={styles.conversationContainer}>
            {state.conversationHistory.map((message, index) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.type === 'user' ? styles.userMessage : styles.aiMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.type === 'ai' && (
                    <div className={styles.aiIcon}>
                      <MessageCircle size={16} />
                    </div>
                  )}
                  <div className={styles.messageText}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {state.error && (
            <div className={styles.errorMessage}>
              <AlertTriangle size={16} />
              <span>{state.error}</span>
            </div>
          )}

          {/* Input Form */}
          {!state.isComplete && (
            <form onSubmit={handleSubmit} className={styles.inputForm}>
              <div className={styles.inputContainer}>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Please provide more details about the incident..."
                  className={styles.textInput}
                  rows={3}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          )}

          {/* Completion Actions */}
          {state.isComplete && (
            <div className={styles.completionActions}>
              <div className={styles.completionMessage}>
                <Shield className={styles.completionIcon} />
                <p>Thank you for providing the details. Your incident report is ready to be submitted.</p>
              </div>
              <div className={styles.actionButtons}>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className={styles.completeButton}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
                </button>
                <button
                  onClick={handleCancel}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Incident ID Display */}
          {state.incidentId && (
            <div className={styles.incidentIdContainer}>
              <span className={styles.incidentIdLabel}>Incident ID:</span>
              <span className={styles.incidentId}>{state.incidentId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
