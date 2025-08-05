"use client";

import { useState, FormEvent } from "react";
import { StepInputConfig } from "../types/form";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "@/app/signin/SignInPage.module.css";
import { useRouter } from 'next/navigation';
import { registerUserAction } from "@/actions/auth/signup";
import { isPasswordCommon } from "./actions";
import { Eye, EyeOff } from "lucide-react";

interface RegisterViewProps {
    onToggleRegister: () => void;
    onError: (error: React.ReactNode | null) => void;
}

const registrationInputs: StepInputConfig[] = [
    {
      type: 'text',
      name: 'name',
      label: 'Name',
      placeholder: 'Enter your name',
    },
    {
      type: 'text',
      name: 'phone',
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      required: true,
    },
];

const RegisterView: React.FC<RegisterViewProps> = ({ onToggleRegister, onError }) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
     const [show, setShow] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        const validatePassword = await isPasswordCommon(password.trim());

        if (validatePassword) {
            onError("Password is too common. Please choose a more secure password.");
            setLoading(false);
            return;
        }

        const result = await registerUserAction({email: email.trim(), password: password.trim(), name: name.trim(), phone: phone.trim()});
        setLoading(false);

        if (!result.ok) {
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
            {registrationInputs.map(input => (
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
                    <div className={styles.passwordContainer}>
                        <InputField
                            type={show ? "text" : "password"}
                            id={`password-register`}
                            name={`password`}
                            placeholder={`Make it secure...`}
                            value={formData[`password` as keyof typeof formData]}
                            onChange={handleInputChange}
                            required={true}
                        />
                        <button
                            type="button"
                            className={styles.togglePasswordVisibility}
                            onClick={() => setShow(!show)}
                            aria-label={show ? "Hide password" : "Show password"}
                        >
                            {show ? <Eye className={styles.eyeIcon} /> : <EyeOff className={styles.eyeIcon} />}
                        </button>
                    </div>
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
                Already have an account? <span className={styles.linkText}>Sign In</span>
            </button>
        </form>
    );
};

export default RegisterView; 