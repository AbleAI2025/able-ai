"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './ReportIssuePage.module.css';

import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import FormCard from '@/app/components/forms/FormCard';
import LabelledSelectInput from '@/app/components/forms/LabelledSelectInput';
import LabelledTextareaInput from '@/app/components/forms/LabelledTextareaInput';
import LabelledFileUploadButton from '@/app/components/forms/LabelledFileUploadButton';
import ChatWidget from '@/app/components/chat/ChatWidget';

const issueTypes = [
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'technical_problem', label: 'Technical Problem' },
  { value: 'other', label: 'Other' },
];

export default function ReportIssuePage() {
  const router = useRouter();
  const params = useParams();
  const gigId = params.gigId as string;

  const [issueType, setIssueType] = useState<string>(issueTypes[0].value);
  const [description, setDescription] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const handleFileChange = (files: FileList | null) => {
    setAttachedFiles(files);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!description.trim()) {
      setSubmitError("Description is required.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('gigId', gigId);
    formData.append('issueType', issueType);
    formData.append('description', description);
    if (attachedFiles) {
      for (let i = 0; i < attachedFiles.length; i++) {
        formData.append('files', attachedFiles[i]);
      }
    }

    try {
      // Simulate API call
      console.log("Submitting issue:", { gigId, issueType, description, numFiles: attachedFiles?.length || 0 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      // const response = await fetch('/api/report-issue', { method: 'POST', body: formData });
      // if (!response.ok) throw new Error('Failed to submit issue.');
      setSubmitSuccess(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error submitting issue:", error);
        setSubmitError(error.message || 'An unknown error occurred.');
      } else {
        console.error("Unknown error submitting issue:", error);
        setSubmitError('An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className={styles.pageContainer}>
        <ScreenHeaderWithBack title="Report an Issue" onBackClick={() => router.back()} />
        <FormCard className={styles.formCard}>
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <h2 style={{color: '#4CAF50', marginBottom: '1rem'}}>Issue Reported Successfully!</h2>
            <p>Thank you for your feedback. We will get back to you shortly.</p>
            <button onClick={() => router.back()} className={styles.submitButton} style={{marginTop: '1.5rem', backgroundColor: '#555'}}>
              Go Back
            </button>
          </div>
        </FormCard>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <ScreenHeaderWithBack title="Report an Issue" onBackClick={() => router.back()} />
      <form onSubmit={handleSubmit} className={styles.formCard}>
        <LabelledSelectInput
          label="Type of Issue"
          options={issueTypes}
          value={issueType}
          onChange={setIssueType}
        />
        <LabelledTextareaInput
          label="Description"
          placeholder="Describe the issue..."
          value={description}
          onChange={setDescription}
          rows={5}
        />
        <LabelledFileUploadButton
          label="Choose files..."
          onFilesSelected={handleFileChange}
        />
        {submitError && <p className={styles.errorMessage}>{submitError}</p>}
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Issue'}
        </button>
      </form>
      <ChatWidget />
    </div>
  );
} 