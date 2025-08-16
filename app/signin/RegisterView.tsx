"use client";

import { useState, FormEvent } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { StepInputConfig } from "../types/form";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/signin/SignInPage.module.css";
import { useRouter } from "next/navigation";
import { registerUserAction } from "@/actions/auth/signup";
import { isPasswordCommon } from "./actions";
import { authClient } from "@/lib/firebase/clientApp";
import { toast } from "sonner";
import PasswordInputField from "../components/form/PasswodInputField";

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onError(null); // Clear previous errors
    setLoading(true);

    const { name, phone, email, password } = formData;

    // Validate email with RFC 5322 standard complaint regex
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      onError("Invalid email address");
      setLoading(false);
      return;
    }
    // Validate password
    const { isValid, error } = await validatePassword(password);
    if (!isValid) {
      onError(error);
      setLoading(false);
      return;
    }
    const result = await registerUserAction({
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      phone: phone.trim(),
    });

    const host =
      window?.location.origin || "https://able-ai-mvp-able-ai-team.vercel.app";
    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: host + "/usermgmt",
      handleCodeInApp: true,
    };

    sendSignInLinkToEmail(authClient, email, actionCodeSettings)
      .then(() => {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem("emailForSignIn", email);
        toast.success(
          "Registration successful! Please check your email to sign in."
        );
      })
      .catch((error) => {
        const errorCode = error.code;
        console.error("Error sending email:", errorCode);
        const errorMessage = error.message;
        toast.error(`Error sending email: ${errorMessage}`);
      });

    setLoading(false);

    if (!result.ok) {
      console.log("Registration error:", result.error);
      onError(result.error);
      setLoading(false);
      return;
    } else {
      // Assuming successful registration/sign-in should redirect
      router.push("/select-role"); // Or your desired post-registration page
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {registrationInputs.map((input) => (
        <div className={styles.inputGroup} key={input.name}>
          <label htmlFor={`${input.name}-register`} className={styles.label}>
            {input.label}
          </label>
          <InputField
            type={input.type as string}
            id={`${input.name}-register`}
            name={input.name}
            placeholder={input.placeholder}
            value={formData[input.name as keyof typeof formData]}
            onChange={handleInputChange}
            required={input.required}
          />
        </div>
      ))}

      <div className={styles.inputGroup}>
        <label htmlFor={`password-register`} className={styles.label}>
          Password
        </label>
        <PasswordInputField
          password={formData.password}
          setPassword={(value: string) =>
            setFormData((prev) => ({ ...prev, password: value }))
          }
          id={`password-register`}
          name={`password-register`}
          placeholder={`Make it secure...`}
          required
        />
    </div>
      <div className={styles.submitWrapper}>
        <SubmitButton loading={loading} disabled={loading}>
          Register
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
