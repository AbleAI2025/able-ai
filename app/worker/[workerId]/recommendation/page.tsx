/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useParams } from "next/navigation";

import InputField from "@/app/components/form/InputField"; // Reusing shared InputField
import { Send, Loader2, Star } from "lucide-react"; // Lucide icons

import styles from "./RecommendationPage.module.css";
import {
  getWorkerForRecommendationAction,
  submitExternalRecommendationAction,
} from "@/actions/user/recommendation";
import Loader from "@/app/components/shared/Loader";

interface RecommendationFormData {
  recommendationText: string;
  relationship: string;
  recommenderName: string;
  recommenderEmail: string;
}

interface SkillsProps {
  id: string | number;
  name: string;
}

async function getWorkerDetails(
  workerId: string
): Promise<{ name: string; skills: SkillsProps[] } | null> {
  const { data } = await getWorkerForRecommendationAction(workerId);

  if (!data) throw new Error("worker not found");

  return { name: data.userName, skills: data.skills };
}

export default function PublicRecommendationPage() {
  const params = useParams();
  const workerToRecommendId = params.workerId as string;

  const [workerDetails, setWorkerDetails] = useState<{
    name: string;
    skills: SkillsProps[];
  } | null>(null);
  const [isLoadingWorker, setIsLoadingWorker] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<{id: string, name: string} | undefined>();

  const [formData, setFormData] = useState<RecommendationFormData>({
    recommendationText: "",
    relationship: "",
    recommenderName: "",
    recommenderEmail: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
   const firstName = React.useMemo(() => workerDetails?.name.split(" ")[0], [workerDetails]);
  
  // Fetch worker details
  useEffect(() => {
    if (workerToRecommendId) {
      setIsLoadingWorker(true);
      getWorkerDetails(workerToRecommendId)
        .then((details) => {
          if (details) {
            setWorkerDetails(details);
          } else {
            setError("Could not load worker details to recommend.");
          }
        })
        .catch((err: Error) => setError(err.message || "Error fetching worker details."))
        .finally(() => setIsLoadingWorker(false));
    }
  }, [workerToRecommendId]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (
      !formData.recommendationText ||
      !formData.relationship ||
      !formData.recommenderName ||
      !formData.recommenderEmail ||
      !selectedSkill
    ) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);

    const submissionPayload = {
      workerId: workerToRecommendId,
      // No recommenderUserId needed for public submission
      ...formData,
      skillId: selectedSkill.id,
    };

    try {
      const result = await submitExternalRecommendationAction(
        submissionPayload
      );
      if (!result.success) {
        throw new Error(result.error || "Failed to submit recommendation.");
      }
      setSuccessMessage("Thank you! Your recommendation has been submitted.");
      setFormData({
        recommendationText: "",
        relationship: "",
        recommenderName: "",
        recommenderEmail: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to submit recommendation.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingWorker) {
    return (
      <div className={styles.loadingContainer}>
        <Loader />
      </div>
    );
  }

  if (!workerDetails) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMessage}>{error || "Worker not found."}</p>
      </div>
    );
  }

  if (workerDetails?.skills.length === 0)
    return <p>{workerDetails.name} doesn't have skills yet to showcase</p>;

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <header className={styles.title}>
          <Star color="#7eeef9" fill=" #7eeef9" />
          <span>Recommendation for {workerDetails.name}</span>
        </header>

        <div className={styles.recommendationCard}>
          <div className={styles.prompt}>
            <p>{firstName} is available for hire on Able! <br />
            Please provide a reference for {firstName}&apos;s skill as a{" "}</p>
            <select
              className={styles.select}
              value={selectedSkill?.id || ""}
              onChange={(e) => {
                const skill = workerDetails.skills.find(
                  (s) => String(s.id) === e.target.value
                );
                setSelectedSkill(
                  skill ? { id: String(skill.id), name: skill.name } : undefined
                );
              }}
            >
              <option value="">Select a skill</option>
              {workerDetails?.skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>

          <p className={styles.note}>
            Your feedback will be added to their public profile.
          </p>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && (
            <p className={styles.successMessage}>{successMessage}</p>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="recommendationText" className={styles.label}>
                Your Recommendation{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <textarea
                id="recommendationText"
                name="recommendationText"
                value={formData.recommendationText}
                onChange={handleChange}
                className={styles.textarea}
                placeholder={selectedSkill?.name ? 
                  `Enter your recommendation here... eg: What makes ${workerDetails.name} great at ${selectedSkill?.name}` : 
                  "Enter your recommendation here..."
                }
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
                placeholder={`Please describe how you know ${workerDetails.name}: e.g., Worked together at [Company/Event], Supervised them, Hired them for a gig...`}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.label}>
                Your Details (won&apos;t be public on their profile){" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
              </span>
              <div className={styles.nameEmailGroup}>
                <InputField
                  id="recommenderName"
                  name="recommenderName"
                  type="text"
                  value={formData.recommenderName}
                  onChange={handleChange}
                  placeholder="Your Full Name"
                  required
                />
                <InputField
                  id="recommenderEmail"
                  name="recommenderEmail"
                  type="email"
                  value={formData.recommenderEmail}
                  onChange={handleChange}
                  placeholder="Your Email Address"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {isSubmitting ? "Submitting..." : "Submit Recommendation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
