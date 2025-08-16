"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams, usePathname } from 'next/navigation';

import InputField from '@/app/components/form/InputField'; // Reusing shared InputField
import { Star, Send, Loader2 } from 'lucide-react'; // Lucide icons

import styles from './RecommendationPage.module.css';
import { useAuth } from '@/context/AuthContext';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';

interface RecommendationFormData {
  recommendationText: string;
  relationship: string;
  recommenderName: string;
  recommenderEmail: string;
}

// Mock function to get worker details - replace with actual API call
async function getWorkerDetails(workerId: string): Promise<{ name: string; primarySkill: string } | null> {
  console.log("Fetching details for workerId:", workerId);
  // In a real app, fetch from your backend:
  // const response = await fetch(`/api/workers/${workerId}/public-profile`);
  // if (!response.ok) return null;
  // return response.json();
  if (workerId === "benji-asamoah-id") { // Example workerId
    return { name: "Benji Asamoah", primarySkill: "Bartender" };
  }
  return { name: "Selected Worker", primarySkill: "Talent" }; // Fallback
}


export default function RecommendationPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname(); // Added pathname
  const recommenderUserId = params.userId as string; // Logged-in user providing recommendation
  const workerToRecommendId = params.workerId as string;

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [workerDetails, setWorkerDetails] = useState<{ name: string; primarySkill: string } | null>(null);
  const [isLoadingWorker, setIsLoadingWorker] = useState(true);

  const [formData, setFormData] = useState<RecommendationFormData>({
    recommendationText: '',
    relationship: '',
    recommenderName: '',
    recommenderEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auth check and initial data load for the recommender
  useEffect(() => {
    if (loadingAuth) return;

    if (!user) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!authUserId) {
      console.error("User is authenticated but UID is missing. Redirecting to signin.");
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Ensure the user from the URL (recommenderUserId) matches the authenticated user
    if (authUserId !== recommenderUserId) {
      router.push('/signin?error=unauthorized'); 
      return;
    }

    // If all checks pass, prefill recommender's name and email
    setFormData(prev => ({
      ...prev,
      recommenderName: user.displayName || '',
      recommenderEmail: user.email || ''
    }));

  }, [user, loadingAuth, authUserId, recommenderUserId, router, pathname]);


  // Fetch worker details
  useEffect(() => {
    if (workerToRecommendId) {
      setIsLoadingWorker(true);
      getWorkerDetails(workerToRecommendId)
        .then(details => {
          if (details) {
            setWorkerDetails(details);
          } else {
            setError("Could not load worker details to recommend.");
          }
        })
        .catch(err => {
          console.error("Error fetching worker details:", err);
          setError("Error fetching worker details.");
        })
        .finally(() => setIsLoadingWorker(false));
    }
  }, [workerToRecommendId]);


  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.recommendationText || !formData.relationship || !formData.recommenderName || !formData.recommenderEmail) {
        setError("All fields are required.");
        return;
    }
    
    setIsSubmitting(true);

    const submissionPayload = {
      workerId: workerToRecommendId,
      recommenderUserId: user?.uid, // Use the authenticated user's UID from context
      ...formData
    };

    try {
      // Replace with your actual API endpoint
      console.log("Submitting recommendation:", submissionPayload);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      const success = true; // Assume success for now
      if (success) {
        setSuccessMessage("Recommendation submitted successfully! Thank you.");
        setFormData({
          recommendationText: '',
          relationship: '',
          recommenderName: user?.displayName || '', // Reset with prefill if available
          recommenderEmail: user?.email || ''
        });
        // Optionally redirect or clear form further
      } else {
        setError("Failed to submit recommendation. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      if (error instanceof Error) {
        setError(`An unexpected error occurred: ${error.message}. Please try again.`);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading spinner while worker details are being fetched (after auth checks pass)
  if (isLoadingWorker) {
    return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin" /> Loading Worker Details...</div>;
  }

  // If we reach here, auth checks have passed and worker details fetching is complete.
  // If workerDetails is null here, it means getWorkerDetails failed.
  if (!workerDetails) {
     return <div className={styles.container}><p className={styles.errorMessage}>{error || "Worker not found."}</p></div>;
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title='Recommendation' onBackClick={() => router.back()} />
      <div className={styles.pageWrapper}>
        <div className={styles.recommendationCard}>
          <p className={styles.prompt}>
            {workerDetails.name} is available for hire on Able! <br /> Please provide a reference for {workerDetails.name}&apos;s skills as a {workerDetails.primarySkill}.
          Your feedback will be added to their public profile.
          </p>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="recommendationText" className={styles.label}>Your Recommendation <span style={{color: 'var(--error-color)'}}>*</span></label>
              <textarea
                id="recommendationText"
                name="recommendationText"
                value={formData.recommendationText}
                onChange={handleChange}
                className={styles.textarea}
                placeholder={`What makes ${workerDetails.name} great at ${workerDetails.primarySkill}?`}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="relationship" className={styles.label}>Please describe how you know {workerDetails.name}? <span style={{color: 'var(--error-color)'}}>*</span></label>
              <textarea
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="e.g., Worked together at [Company/Event], Supervised them, Hired them for a gig..."
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="recommenderName" className={styles.label}>Your Details (won&apos;t be public on their profile) <span style={{color: 'var(--error-color)'}}>*</span></label>
              <div className={styles.nameEmailGroup}>
                <InputField
                    id="recommenderName"
                    name="recommenderName"
                    type="text"
                    value={formData.recommenderName}
                    onChange={handleChange}
                    placeholder='Your Full Name'
                    required
                />
                <InputField
                    id="recommenderEmail"
                    name="recommenderEmail"
                    type="email"
                    value={formData.recommenderEmail}
                    onChange={handleChange}
                    placeholder='Your Email Address'
                    required
                />
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 