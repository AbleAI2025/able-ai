/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import InputField from '@/app/components/form/InputField'; // Reusing shared InputField
import { Star, Send, Loader2 } from 'lucide-react'; // Lucide icons

import styles from './RecommendationPage.module.css';
import Logo from '@/app/components/brand/Logo';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import { getWorkerForRecommendationAction, submitExternalRecommendationAction } from '@/actions/user/recommendation';

interface RecommendationFormData {
  recommendationText: string;
  relationship: string;
  recommenderName: string;
  recommenderEmail: string;
}

interface SkillsProps { id: string | number; name: string }



async function getWorkerDetails(workerId: string): Promise<{ name: string; skills: SkillsProps[] } | null> {
  const { data } = await getWorkerForRecommendationAction(workerId)

  if (!data) throw new Error("worker not found")

  return { name: data.userName, skills: data.skills };
}


export default function PublicRecommendationPage() {
  const params = useParams();
  const workerToRecommendId = params.workerId as string;
  const router = useRouter();

  const [workerDetails, setWorkerDetails] = useState<{ name: string; skills: SkillsProps[] } | null>(null);
  const [isLoadingWorker, setIsLoadingWorker] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string>("");

  const [formData, setFormData] = useState<RecommendationFormData>({
    recommendationText: '',
    relationship: '',
    recommenderName: '',
    recommenderEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const firstName = workerDetails?.name.split(' ')[0];
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
        .catch(() => setError("Error fetching worker details."))
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
      // No recommenderUserId needed for public submission
      ...formData
    };

    try {
      const result = await submitExternalRecommendationAction(submissionPayload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit recommendation.');
      }
      setSuccessMessage('Thank you! Your recommendation has been submitted.');
      setFormData({ recommendationText: '', relationship: '', recommenderName: '', recommenderEmail: '' });

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to submit recommendation.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingWorker) {
    return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin" /> Loading Recommendation Form...</div>;
  }

  if (!workerDetails) {
    return <div className={styles.container}><p className={styles.errorMessage}>{error || "Worker not found."}</p></div>;
  }

  return (
    <div className={styles.container}>
      <ScreenHeaderWithBack title="Recommendation" onBackClick={() => router.back()} />
      <div className={styles.pageWrapper}>
        {/* <header className={styles.title}>
          <Star className={styles.starIcon} />
          <span>Recommendation for {workerDetails.name}</span> */}
        {/* </header> */}

        <div className={styles.recommendationCard}>
          <p className={styles.prompt}>
            {firstName} is available for hire on Able! <br />
            Please provide a reference for {firstName}&apos;s skills as a{" "}
            <select
              className={styles.select}
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="">Select a skill</option>
              {workerDetails?.skills.map((skill) => (
                <option key={skill.id} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </select>
          </p>

          <p className={styles.note}>Your feedback will be added to their public profile.</p>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="recommendationText" className={styles.label}>Your Recommendation <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <textarea
                id="recommendationText"
                name="recommendationText"
                value={formData.recommendationText}
                onChange={handleChange}
                className={styles.textarea}
                placeholder={`Enter your recommendation here... eg: What makes ${workerDetails.name} great at ${selectedSkill}`}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              {/* <label htmlFor="relationship" className={styles.label}>How do you know {workerDetails.name}? <span style={{color: 'var(--error-color)'}}>*</span></label> */}
              <textarea
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Please describe how you know Benji: e.g., Worked together at [Company/Event], Supervised them, Hired them for a gig..."
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Your Details (won&apos;t be public on their profile) <span style={{ color: 'var(--error-color)' }}>*</span></label>
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

        {/* <div className={styles.botMessageContainer}>
          <Logo width={60} height={60} />
          <p className={styles.botText}>
            Hi! I am Able AI agent - please let me know if you have any gig work needs or would like to add a skills profile to our platform
          </p>
        </div> */}
      </div>
    </div>
  );
} 
