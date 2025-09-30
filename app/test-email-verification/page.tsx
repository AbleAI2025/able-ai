"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import EmailVerificationGuard from '@/components/auth/EmailVerificationGuard';

/**
 * Test page for email verification functionality
 * This page demonstrates how the EmailVerificationGuard works
 */
export default function TestEmailVerificationPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Email Verification Test Page</h1>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h2>Current User Status:</h2>
        {user ? (
          <div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Email Verified:</strong> {user.emailVerification?.isVerified ? 'Yes' : 'No'}</p>
            <p><strong>Needs Verification:</strong> {user.emailVerification?.needsVerification ? 'Yes' : 'No'}</p>
            <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
          </div>
        ) : (
          <p>No user logged in</p>
        )}
      </div>

      <EmailVerificationGuard requireVerification={true}>
        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          padding: '20px', 
          borderRadius: '8px',
          color: '#155724'
        }}>
          <h2>✅ Protected Content</h2>
          <p>This content is only visible to users with verified email addresses.</p>
          <p>If you can see this, your email is verified!</p>
        </div>
      </EmailVerificationGuard>

      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        color: '#856404'
      }}>
        <h3>How to Test:</h3>
        <ol>
          <li>Sign in with an unverified email address</li>
          <li>You should see the email verification modal</li>
          <li>Verify your email through the link sent to your inbox</li>
          <li>Refresh this page - you should now see the protected content</li>
        </ol>
      </div>
    </div>
  );
}
