"use client";

import { useState, FormEvent, useEffect } from "react";
import { sendSignInLinkToEmail, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { StepInputConfig } from "@/app/types/form";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/SignInPage.module.css";
import { useRouter } from "next/navigation";
import { registerUserAction } from "@/actions/auth/signup";
import { isPasswordCommon } from "@/app/actions/password-check";
import { authClient } from "@/lib/firebase/clientApp";
import { toast } from "sonner";
import PasswordInputField from "@/app/components/form/PasswodInputField";
import { checkEmailVerificationStatus } from "@/lib/utils/emailVerification";
import EmailVerificationModal from "./EmailVerificationModal";

interface RegisterViewProps {
  onToggleRegister: () => void;
  onError: (error: React.ReactNode | null) => void;
}


type RegistrationStep = 'form' | 'email-verification' | 'verification-complete';

const RegisterView: React.FC<RegisterViewProps> = ({
  onToggleRegister,
  onError,
}) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle email verification when user returns from email link
  useEffect(() => {
    const handleEmailVerificationReturn = async () => {
      if (isSignInWithEmailLink(authClient, window.location.href)) {
        try {
          let email = window.localStorage.getItem("emailForSignIn");
          if (!email) {
            email = formData.email;
          }
          
          if (email) {
            await signInWithEmailLink(authClient, email, window.location.href);
            window.localStorage.removeItem("emailForSignIn");
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Set verification complete
            setVerificationComplete(true);
            setCurrentStep('verification-complete');
            toast.success("Email verified successfully! Redirecting to role selection...");
            
            // Redirect to role selection after a short delay
            setTimeout(() => {
              router.push('/select-role');
            }, 2000);
          }
        } catch (error) {
          console.error("Error handling email verification:", error);
          onError("Failed to verify email. Please try again.");
        }
      }
    };

    handleEmailVerificationReturn();
  }, [authClient, formData.email, router, onError]);

  // Monitor email verification status
  useEffect(() => {
    if (currentStep === 'email-verification' && !verificationComplete) {
      setIsVerifying(true);
      
      const unsubscribe = onAuthStateChanged(authClient, (user) => {
        if (user && user.emailVerified) {
          setVerificationComplete(true);
          setIsVerifying(false);
          setCurrentStep('verification-complete');
          toast.success("Email verified successfully! Redirecting to role selection...");
          
          // Redirect to role selection after a short delay
          setTimeout(() => {
            router.push('/select-role');
          }, 2000);
        }
      });

      return () => unsubscribe();
    }
  }, [currentStep, verificationComplete, authClient, router]);


  const validatePassword = async (password: string) => {
    const lengthIsCorrect = password.trim().length >= 10;
    if (!lengthIsCorrect)
      return {
        isValid: false,
        error: "Password must be at least 10 characters long.",
      };
    const isCommonPass = await isPasswordCommon(password.trim());
    if (isCommonPass)
      return {
        isValid: false,
        error: "Password is too common. Please choose a more secure password.",
      };
    return { isValid: true, error: null };
  };

  const validateForm = async () => {
    const { name, phone, email, password } = formData;

    // Validate name
    if (!name.trim()) {
      onError("Name is required");
      return false;
    }

    // Validate phone
    if (!phone.trim()) {
      onError("Phone number is required");
      return false;
    }

    // Validate email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      onError("Invalid email address");
      return false;
    }

    // Validate password
    const { isValid, error } = await validatePassword(password);
    if (!isValid) {
      onError(error);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null);
    setLoading(true);

    const isValid = await validateForm();
    if (!isValid) {
      setLoading(false);
      return;
    }

    // Register user with phone number
    try {
      const result = await registerUserAction({
        email: formData.email.trim(),
        password: formData.password.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      if (!result.ok) {
        onError(result.error);
        setLoading(false);
        return;
      }

      // Check if user is authenticated and get their verification status
      if (authClient?.currentUser) {
        const verificationStatus = checkEmailVerificationStatus(authClient.currentUser);
        
        if (verificationStatus.needsVerification) {
          // Show verification modal instead of proceeding
          setUnverifiedUserEmail(verificationStatus.email || formData.email);
          setShowVerificationModal(true);
          setLoading(false);
          return;
        } else if (verificationStatus.isVerified) {
          // Email is already verified, proceed to role selection
          toast.success("Registration successful! Redirecting...");
          router.push('/select-role');
          return;
        }
      }

      // Fallback: Move to email verification step if no user found
      setCurrentStep('email-verification');
      
      // Automatically send verification email after successful registration
      await handleEmailVerification();

    } catch (error: any) {
      console.error('Registration error:', error);
      onError(error.message || 'Registration failed');
      setLoading(false);
    }
  };


  const handleEmailVerification = async () => {
    try {
      setLoading(true);
      onError(null);

      const host = window?.location.origin || "https://able-ai-mvp-able-ai-team.vercel.app";
      const actionCodeSettings = {
        url: host + "/?verified=true",
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(authClient, formData.email, actionCodeSettings);
      
      window.localStorage.setItem("emailForSignIn", formData.email);
      setEmailSent(true);
      toast.success("Verification email sent successfully!");
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 3000);

    } catch (error: any) {
      console.error("Error sending email:", error);
      onError(`Error sending email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    onError(null);
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setUnverifiedUserEmail("");
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    setUnverifiedUserEmail("");
    // The user will be automatically redirected by the auth state change
    toast.success("Email verified successfully! Redirecting...");
    router.push('/select-role');
  };

  // Render different steps

  if (currentStep === 'verification-complete') {
    return (
      <div className={styles.emailVerificationContainer}>
        <div className={styles.emailVerificationHeader}>
          <h2 className={styles.emailVerificationTitle}>
            Email Verified! 🎉
          </h2>
          <p className={styles.emailVerificationSubtitle}>
            Your email has been successfully verified
          </p>
        </div>

        <div>
          <p className={styles.emailInstructions}>
            Redirecting you to role selection...
          </p>

          <div className={styles.loadingSpinner} style={{ margin: '20px auto', width: '32px', height: '32px' }}></div>
        </div>
      </div>
    );
  }

  if (currentStep === 'email-verification') {
    return (
      <div className={styles.emailVerificationContainer}>
        <div className={styles.emailVerificationHeader}>
          <h2 className={styles.emailVerificationTitle}>
            Verify Your Email
          </h2>
          <p className={styles.emailVerificationSubtitle}>
            We've sent a verification link to
          </p>
          <p className={styles.emailAddress}>
            {formData.email}
          </p>
        </div>

        <div>
          <p className={styles.emailInstructions}>
            Please check your email and click the verification link to complete your registration.
          </p>

          {isVerifying && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div className={styles.loadingSpinner} style={{ margin: '0 auto 10px', width: '24px', height: '24px' }}></div>
              <p style={{ color: '#a0a0a0', fontSize: '14px' }}>Waiting for email verification...</p>
            </div>
          )}

          <button
            onClick={handleEmailVerification}
            disabled={loading || isVerifying}
            className={`${styles.resendButton} ${emailSent ? styles.success : ''}`}
          >
            {loading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                Sending...
              </>
            ) : emailSent ? (
              <>
                <svg className={styles.emailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent!
              </>
            ) : (
              <>
                <svg className={styles.emailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Resend Verification Email
              </>
            )}
          </button>

          <button
            onClick={handleBackToForm}
            className={styles.backToFormButton}
            disabled={isVerifying}
          >
            ← Back to registration form
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputGroup}>
        <label htmlFor="name-register" className={styles.label}>
          Name
        </label>
        <InputField
          type="text"
          id="name-register"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>


      <div className={styles.inputGroup}>
        <label htmlFor="email-register" className={styles.label}>
          Email Address
        </label>
        <InputField
          type="email"
          id="email-register"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="phone-register" className={styles.label}>
          Phone Number
        </label>
        <InputField
          type="tel"
          id="phone-register"
          name="phone"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="password-register" className={styles.label}>
          Password
        </label>
        <PasswordInputField
          password={formData.password}
          setPassword={(value: string) =>
            setFormData((prev) => ({ ...prev, password: value }))
          }
          id="password-register"
          name="password-register"
          placeholder="Make it secure..."
          required
        />
      </div>

      <div className={styles.submitWrapper}>
        <SubmitButton loading={loading} disabled={loading}>
          Register Account
        </SubmitButton>
      </div>

      <button
        type="button"
        className={styles.toggleButton}
        onClick={onToggleRegister}
      >
        Already have an account?{" "}
        <span className={styles.linkText}>Sign In</span>
      </button>
    </form>

    <EmailVerificationModal
      isOpen={showVerificationModal}
      onClose={handleCloseVerificationModal}
      userEmail={unverifiedUserEmail}
      onVerificationComplete={handleVerificationComplete}
    />
    </>
  );
};

export default RegisterView;
