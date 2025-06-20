"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

// Shared InputField, or use direct styling with .input class
import InputField from '@/app/components/form/InputField'; // Assuming general input style
import { UploadCloud, Loader2 } from 'lucide-react'; // Icon for upload

import styles from './ReferralPage.module.css';
import { useAuth } from '@/context/AuthContext';

interface ReferralFormData {
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  additionalNotes: string;
  businessProfile: File | null;
}

export default function ReferralPage() {
  const params = useParams();
  const pageUserId = params.userId as string;

  const { user, loading: loadingAuth } = useAuth();

  const authUserId = user?.uid;
  const [formData, setFormData] = useState<ReferralFormData>({
    businessName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    additionalNotes: '',
    businessProfile: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on change
    setSuccessMessage(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    setFormData(prev => ({ ...prev, businessProfile: file || null }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.contactName || !formData.contactEmail || !formData.contactPhone) {
        setError("Contact name, email, and phone number are required.");
        return;
    }
    
    setIsLoading(true);

    const submissionData = new FormData(); // Use FormData for file uploads
    submissionData.append('referrerUserId', authUserId || ''); // Get from context
    submissionData.append('businessName', formData.businessName);
    submissionData.append('contactName', formData.contactName);
    submissionData.append('contactEmail', formData.contactEmail);
    submissionData.append('contactPhone', formData.contactPhone);
    submissionData.append('additionalNotes', formData.additionalNotes);
    if (formData.businessProfile) {
      submissionData.append('businessProfile', formData.businessProfile, formData.businessProfile.name);
    }

    try {
      // Replace with your actual API endpoint for submitting referrals
      // const response = await fetch('/api/referrals/submit', {
      //   method: 'POST',
      //   body: submissionData, // FormData handles headers for multipart
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to submit referral.');
      // }
      // const result = await response.json();

      // MOCK API CALL
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form Data Submitted:', Object.fromEntries(submissionData.entries()));
      
      setSuccessMessage('Referral submitted successfully! You will be notified if it leads to a successful sign-up.');
      setFormData({ // Reset form
        businessName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        additionalNotes: '',
        businessProfile: null,
      });

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to submit referral. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loadingAuth || (!user && !loadingAuth) || (authUserId && authUserId !== pageUserId) ) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <div className={styles.profileHeader}>
          <Image
            src={user?.photoURL || "/images/logo-placeholder.svg"} // Use user's actual image or placeholder
            alt={user?.displayName || "User"}
            width={48}
            height={48}
            className={styles.profileImage}
          />
          <span className={styles.profileName}>{user?.displayName || "User"}</span>
        </div>

        <h1 className={styles.referralHeading}>Refer a New Business</h1>
        <p className={styles.referralSubheading}>Help a business discover Able AI and earn £5 when they make their first successful hire!</p>

        {error && <p className={styles.errorMessage}>{error}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="businessName" className={styles.label}>Business name (if applicable)</label>
            <InputField // Using shared InputField component
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g., The Local Cafe"
              // className={styles.input} // InputField handles its own styling
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="contactName" className={styles.label}>Contact name <span style={{color: 'var(--error-color)'}}>*</span></label>
            <InputField
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="e.g., Alex Smith"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="contactEmail" className={styles.label}>Contact email <span style={{color: 'var(--error-color)'}}>*</span></label>
            <InputField
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="e.g., contact@business.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="contactPhone" className={styles.label}>Contact phone number <span style={{color: 'var(--error-color)'}}>*</span></label>
            <InputField
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="e.g., 07123456789"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="additionalNotes" className={styles.label}>Additional notes, links etc.</label>
            <textarea // Using textarea directly for multi-line, styled by .textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Any extra details you'd like to share?"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="businessProfile" className={styles.label}>
              Upload business profile (e.g., business card, photo - optional)
            </label>
            <input
              type="file"
              id="businessProfile"
              name="businessProfile"
              accept="image/*,.pdf" // Specify acceptable file types
              onChange={handleFileChange}
              style={{ display: 'none' }} 
            />
            <label htmlFor="businessProfile" className={styles.fileUploadContainer}>
              <UploadCloud size={24} className={styles.uploadIcon} />
              <span className={styles.uploadText}>
                {formData.businessProfile ? formData.businessProfile.name : 'Click or drag file to upload'}
              </span>
              {formData.businessProfile && <span className={styles.fileName}>{formData.businessProfile.name}</span>}
            </label>
          </div>

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? <><Loader2 size={20} className="animate-spin" style={{marginRight: '0.5rem'}} /> Submitting...</> : 'Submit Referral'}
          </button>
        </form>
      </div>
    </div>
  );
} 