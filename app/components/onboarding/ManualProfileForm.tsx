import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveWorkerProfileFromOnboardingAction } from '@/actions/user/gig-worker-profile';
import { useAuth } from '@/context/AuthContext';
import styles from './ManualProfileForm.module.css';
import LocationPickerBubble from './LocationPickerBubble';
import VideoRecorderBubble from './VideoRecorderBubble';

// Helper: generate a compact random code and build a recommendation URL
function generateRandomCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
  let result = "";
  const array = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += alphabet[array[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return result;
}

function buildRecommendationLink(): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  const code = generateRandomCode(10);
  // Example format requested: /worker/{code}/recommendation
  return `${origin}/worker/${code}/recommendation`;
}

interface FormData {
  about: string;
  experience: string;
  skills: string;
  hourlyRate: number;
  location: any; // Changed to any for LocationPickerBubble
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  videoIntro: File | null;
  references: string;
}

interface ManualProfileFormProps {
  onSubmit: (formData: FormData) => void;
  onSwitchToAI: () => void;
  initialData?: Partial<FormData>;
}

const ManualProfileForm: React.FC<ManualProfileFormProps> = ({
  onSubmit,
  onSwitchToAI,
  initialData = {}
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    about: '',
    experience: '',
    skills: '',
    hourlyRate: 0,
    location: null,
    availability: {
      days: [],
      startTime: '09:00',
      endTime: '17:00'
    },
    videoIntro: null,
    references: buildRecommendationLink(),
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Calculate progress based on filled fields
  useEffect(() => {
    const requiredFields = ['about', 'experience', 'skills', 'hourlyRate', 'location', 'availability', 'videoIntro'];
    const filledFields = requiredFields.filter(field => {
      const value = formData[field as keyof FormData];
      if (field === 'location') {
        return value && typeof value === 'object' && 'lat' in value && 'lng' in value;
      }
      if (field === 'availability') {
        return value && Array.isArray(value.days) && value.days.length > 0;
      }
      if (field === 'videoIntro') {
        return value && value instanceof File;
      }
      return value && (typeof value === 'string' ? value.trim() !== '' : value > 0);
    });
    setProgress((filledFields.length / requiredFields.length) * 100);
  }, [formData]);

  const validateField = (name: keyof FormData, value: any): string => {
    switch (name) {
      case 'about':
        return value.trim().length < 10 ? 'Please provide at least 10 characters about yourself' : '';
      case 'experience':
        return value.trim().length < 10 ? 'Please describe your experience (at least 10 characters)' : '';
      case 'skills':
        return value.trim().length < 5 ? 'Please list your skills (at least 5 characters)' : '';
      case 'hourlyRate':
        return !value || value < 5 ? 'Please enter a valid hourly rate (minimum £5)' : '';
      case 'location':
        return !value || !value.lat || !value.lng ? 'Please select your location' : '';
      case 'availability':
        return !value.days || value.days.length === 0 ? 'Please select at least one day of availability' : '';
      case 'videoIntro':
        return !value || !(value instanceof File) ? 'Please record a video introduction' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = (locationData: any) => {
    setFormData(prev => ({ ...prev, location: locationData }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleVideoRecorded = (blob: Blob) => {
    const file = new File([blob], 'video-intro.webm', { type: 'video/webm' });
    setFormData(prev => ({ ...prev, videoIntro: file }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter(d => d !== day)
          : [...prev.availability.days, day]
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const fieldName = key as keyof FormData;
      const value = formData[fieldName];
      const error = validateField(fieldName, value);

      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Create Your Worker Profile</h2>
        <p className={styles.formSubtitle}>
          Fill out the form below to complete your profile setup
        </p>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(progress)}% Complete</span>
        </div>

        {/* Switch to AI Option */}
        <button
          type="button"
          className={styles.switchButton}
          onClick={onSwitchToAI}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
          Switch to AI-Assisted Setup
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* About Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>About You</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tell us about yourself *
            </label>
            <textarea
              className={`${styles.textarea} ${errors.about ? styles.error : ''}`}
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              placeholder="Tell us about yourself and your background..."
              rows={4}
            />
            {errors.about && <span className={styles.errorText}>{errors.about}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Your Experience *
            </label>
            <textarea
              className={`${styles.textarea} ${errors.experience ? styles.error : ''}`}
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              placeholder="Tell us about your experience in your field..."
              rows={3}
            />
            {errors.experience && <span className={styles.errorText}>{errors.experience}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Skills & Certifications *
            </label>
            <textarea
              className={`${styles.textarea} ${errors.skills ? styles.error : ''}`}
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              placeholder="List your skills, certifications, and qualifications..."
              rows={3}
            />
            {errors.skills && <span className={styles.errorText}>{errors.skills}</span>}
          </div>
        </div>

        {/* Pricing & Location Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Pricing & Location</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Hourly Rate (£) *
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.currencySymbol}>£</span>
              <input
                type="number"
                className={`${styles.input} ${styles.rateInput} ${errors.hourlyRate ? styles.error : ''}`}
                value={formData.hourlyRate || ''}
                onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                placeholder="15"
                min="5"
                step="0.50"
              />
            </div>
            {errors.hourlyRate && <span className={styles.errorText}>{errors.hourlyRate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Your Location *
            </label>
            <LocationPickerBubble
              value={formData.location}
              onChange={handleLocationChange}
              role="GIG_WORKER"
            />
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}
          </div>
        </div>

        {/* Availability Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Weekly Availability</h3>
          <p className={styles.helpText}>Set your recurring weekly availability schedule</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Available Days *
            </label>
            <div className={styles.availabilityDays}>
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`${styles.dayButton} ${
                    formData.availability.days.includes(day.value) ? styles.dayButtonActive : ''
                  }`}
                  onClick={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
                         {errors.availability && <span className={styles.errorText}>{errors.availability}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Available Hours *
            </label>
            <div className={styles.timeRangeContainer}>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>From:</label>
                <input
                  type="time"
                  className={styles.input}
                  value={formData.availability.startTime}
                  onChange={(e) => handleInputChange('availability', {
                    ...formData.availability,
                    startTime: e.target.value
                  })}
                />
              </div>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>To:</label>
                <input
                  type="time"
                  className={styles.input}
                  value={formData.availability.endTime}
                  onChange={(e) => handleInputChange('availability', {
                    ...formData.availability,
                    endTime: e.target.value
                  })}
                />
              </div>
            </div>
            <p className={styles.helpText}>
              Your availability will be set as: {formData.availability.days.length > 0 ?
                `${formData.availability.days.map(day => weekDays.find(d => d.value === day)?.label).join(', ')} ${formData.availability.startTime} - ${formData.availability.endTime}` :
                'Please select days and times'
              }
            </p>
          </div>
        </div>

        {/* Media & References Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Media & References</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Video Introduction *
            </label>
            <VideoRecorderBubble
              onVideoRecorded={handleVideoRecorded}
              prompt="Record a 30-second introduction video to help clients get to know you"
            />
            {formData.videoIntro && (
              <p className={styles.helpText}>Video recorded: {formData.videoIntro.name}</p>
            )}
            {errors.videoIntro && <span className={styles.errorText}>{errors.videoIntro}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              References Link
            </label>
            <div className={styles.referencesContainer}>
              <div className={styles.referencesInfo}>
                <p className={styles.referencesDescription}>
                  Share this link with your previous employers, colleagues, or clients to collect references:
                </p>
                <div className={styles.referencesLinkContainer}>
                  <input
                    type="text"
                    className={styles.referencesLink}
                    value={formData.references}
                    readOnly
                    placeholder="Generating reference link..."
                  />
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => {
                      navigator.clipboard.writeText(formData.references);
                      // You could add a toast notification here
                    }}
                    title="Copy link to clipboard"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <p className={styles.helpText}>
                  Send this link to people who can provide references for your work. They'll be able to submit recommendations directly through our platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || progress < 100}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                Creating Profile...
              </>
            ) : (
              'Complete Profile Setup'
            )}
          </button>

          {progress < 100 && (
            <p className={styles.completionNote}>
              Please fill in all required fields to complete your profile
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ManualProfileForm;
