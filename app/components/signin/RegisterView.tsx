"use client";

import { useState, FormEvent } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
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

interface RegisterViewProps {
  onToggleRegister: () => void;
  onError: (error: React.ReactNode | null) => void;
}

const registrationInputs: StepInputConfig[] = [
  {
    type: "text",
    name: "name",
    label: "Name",
    placeholder: "Enter your name",
  },
  {
    type: "text",
    name: "phone",
    label: "Phone Number",
    placeholder: "Enter your phone number",
  },
  {
    type: "email",
    name: "email",
    label: "Email Address",
    placeholder: "Enter your email",
    required: true,
  },
];

type RegistrationStep = 'form' | 'email-verification';

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
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


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

      // Move to email verification step
      setCurrentStep('email-verification');
      setLoading(false);

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
        url: host + "/usermgmt",
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

  // Render different steps

  if (currentStep === 'email-verification') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            We've sent a verification link to
          </p>
          <p className="font-semibold text-gray-900">
            {formData.email}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Please check your email and click the verification link to complete your registration.
          </p>

          <button
            onClick={handleEmailVerification}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-md flex items-center justify-center gap-2 font-semibold ${
              emailSent 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 focus:ring-green-500' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : emailSent ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Resend Verification Email
              </>
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleBackToForm}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to registration form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default RegisterView;
