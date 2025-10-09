"use client";

import { useState, FormEvent } from "react";
import {
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import PasswordInputField from "@/app/components/form/PasswodInputField";
import styles from "@/app/SignInPage.module.css";
import { useRouter } from "next/navigation";
import { registerUserAction } from "@/actions/auth/signup";
import { isPasswordCommon } from "@/app/actions/password-check";
import { authClient } from "@/lib/firebase/clientApp";
import { toast } from "sonner";
import EmailVerificationModal from "./EmailVerificationModal";
import { formatPhoneNumber } from "@/app/(web-client)/user/[userId]/settings/settingsUtils";

interface RegisterViewProps {
  onToggleRegister: () => void;
  onError: (error: React.ReactNode | null) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({
  onToggleRegister,
  onError,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [unverifiedUserEmail, setUnverifiedUserEmail] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = async (password: string) => {
    if (password.trim().length < 10)
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

    if (!name.trim()) return onError("Name is required"), false;
    if (!phone.trim()) return onError("Phone number is required"), false;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email.trim()))
      return onError("Invalid email address"), false;

    const { isValid, error } = await validatePassword(password);
    if (!isValid) return onError(error), false;

    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null);
    setLoading(true);

    const isValid = await validateForm();
    if (!isValid) return setLoading(false);

    try {
      const formattedPhone = formatPhoneNumber(formData.phone.trim());
      if (formData.phone.trim() && !formattedPhone) {
        throw new Error(
          "Invalid phone number format. Please enter a valid number, e.g., +1234567890"
        );
      }

      const userCredential = await createUserWithEmailAndPassword(
        authClient,
        formData.email.trim(),
        formData.password.trim()
      );

      const result = await registerUserAction({
        firebaseUid: userCredential.user.uid,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        email: formData.email.trim(),
        password: formData.password.trim(),
        name: formData.name.trim(),
        phone: formattedPhone,
      });

      if (!result.ok) {
        onError(result.error);
        setLoading(false);
        return;
      }

      await sendEmailVerification(userCredential.user);
      toast.success("Verification email sent successfully!");
      setEmailSent(true);
      setUnverifiedUserEmail(formData.email);
      setShowVerificationModal(true);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";

      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setUnverifiedUserEmail("");
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    toast.success("Email verified successfully! Redirecting...");
    router.push("/select-role");
  };

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
