"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';

import InputField from '@/app/components/form/InputField'; // Reusing shared InputField
import { Star, Send, Loader2 } from 'lucide-react'; // Lucide icons

import styles from './RecommendationPage.module.css';

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
  const recommenderUserId = params.userId as string; // Logged-in user providing recommendation
  const workerToRecommendId = params.workerId as string;

  const { isAuthenticated, isLoading, user } = useAppContext();

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

  // Auth check and initial data load
  useEffect(() => {
    // Check if auth loading is complete
    if (!isLoading) {
      // Redirect if not authenticated or the authenticated user's ID doesn't match the recommender ID in the URL
      if (!isAuthenticated || (user && user.uid !== recommenderUserId)) {
        router.replace('/signin'); // Or an appropriate error/access denied page
      } else {
        // Prefill recommender's name and email if available from context user object
        setFormData(prev => ({
          ...prev,
          recommenderName: user?.displayName || '',
          recommenderEmail: user?.email || ''
        }));
      }
    }
  }, [isAuthenticated, isLoading, user, recommenderUserId, router]); // Added user to dependency array


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
        .catch(err => setError("Error fetching worker details."))
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
      // Replace with your actual API endpoint for submitting recommendations
      // const response = await fetch('/api/recommendations/submit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(submissionPayload),
      // });
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to submit recommendation.');
      // }
      // const result = await response.json();

      // MOCK API CALL
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Recommendation Submitted:', submissionPayload);
      
      setSuccessMessage('Thank you! Your recommendation has been submitted.');
      // Optionally redirect or clear form
      // setFormData({ recommendationText: '', relationship: '', recommenderName: '', recommenderEmail: '' });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Updated loading/error conditions
  if (isLoading || isLoadingWorker || (!isAuthenticated && !isLoading) || (isAuthenticated && user?.uid !== recommenderUserId)) {
    // Handle cases where auth is loading, worker details are loading,
    // or auth is complete but the user is not the recommender.
    if (!isLoading && !isLoadingWorker && (!isAuthenticated || (isAuthenticated && user?.uid !== recommenderUserId))) {
        // If loading is complete and auth fails or user ID doesn't match
        return <div className={styles.container}><p className={styles.errorMessage}>Access Denied or Worker Not Found.</p></div>;
    }
    // Show loading spinner while still loading auth or worker details
    return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin" /> Loading Recommendation Form...</div>;
  }

  // If we reach here, it means: !isLoading && isAuthenticated && user?.uid === recommenderUserId && !isLoadingWorker
  // And if workerDetails is null here, it means getWorkerDetails failed after loading.
  if (!workerDetails) {
     return <div className={styles.container}><p className={styles.errorMessage}>{error || "Worker not found."}</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <h1 className={styles.title}>
          <Star size={28} className={styles.starIcon} />
          Recommendation for {workerDetails.name}
        </h1>

        <div className={styles.recommendationCard}>
          <p className={styles.prompt}>
            {workerDetails.name} is available for hire on Able! Please provide a reference for {workerDetails.name}'s skills as a {workerDetails.primarySkill}.
            Your feedback will be added to their public profile after review.
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
              <label htmlFor="relationship" className={styles.label}>How do you know {workerDetails.name}? <span style={{color: 'var(--error-color)'}}>*</span></label>
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
              <label className={styles.label}>Your Details (won't be public on their profile) <span style={{color: 'var(--error-color)'}}>*</span></label>
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
              {isSubmitting ? 'Submitting...' : 'Submit Recommendation'}
            </button>
          </form>
        </div>

        <div className={styles.botMessageContainer}>
          <Image
            src="/images/logo-placeholder.svg" // Replace with actual bot avatar
            alt="Able AI Agent"
            width={40}
            height={40}
            className={styles.botAvatar}
          />
          <p className={styles.botText}>
            Thank you for helping build our community! If you need assistance or want to find talent yourself, feel free to ask.
          </p>
        </div>
      </div>
    </div>
  );
} 