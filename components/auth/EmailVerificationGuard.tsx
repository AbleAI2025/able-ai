"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirebase } from '@/context/FirebaseContext';
import { sendEmailVerification, sendSignInLinkToEmail } from 'firebase/auth';
import { toast } from 'sonner';
import EmailVerificationModal from '@/app/components/signin/EmailVerificationModal';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireVerification?: boolean;
}

/**
 * EmailVerificationGuard component
 * Wraps content and shows email verification modal if user's email is not verified
 */
const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({
  children,
  fallback = null,
  requireVerification = true
}) => {
  const { user, loading } = useAuth();
  const { authClient } = useFirebase();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Don't render anything while loading
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px' 
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  // If no user, show fallback or children
  if (!user) {
    return <>{children}</>;
  }

  // If email verification is not required, show children
  if (!requireVerification) {
    return <>{children}</>;
  }

  // If email is verified, show children
  if (user.emailVerification?.isVerified) {
    return <>{children}</>;
  }

  // If email needs verification, show modal
  if (user.emailVerification?.needsVerification) {
    return (
      <>
        {fallback}
        <EmailVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userEmail={user.emailVerification.email || ''}
          onVerificationComplete={() => {
            setShowVerificationModal(false);
            toast.success('Email verified successfully!');
          }}
        />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            maxWidth: '500px'
          }}>
            <h3 style={{ 
              color: '#856404', 
              margin: '0 0 10px 0',
              fontSize: '18px'
            }}>
              Email Verification Required
            </h3>
            <p style={{ 
              color: '#856404', 
              margin: '0 0 15px 0',
              fontSize: '14px'
            }}>
              Please verify your email address to continue using the application.
            </p>
            <p style={{ 
              color: '#856404', 
              margin: '0 0 15px 0',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Email: {user.emailVerification.email}
            </p>
            <button
              onClick={() => setShowVerificationModal(true)}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Verify Email Address
            </button>
          </div>
        </div>
      </>
    );
  }

  // Default fallback
  return <>{fallback}</>;
};

export default EmailVerificationGuard;
