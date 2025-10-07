import React, { FormEvent } from "react";
import { Shield } from "lucide-react";
import PasswordInputField from "@/app/components/form/PasswodInputField";
import styles from "./SettingsPage.module.css";

interface SecuritySectionProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (value: string) => void;
  handleChangePassword: (event: FormEvent) => void;
  handleForgotPassword: () => void;
  isSavingProfile: boolean;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  handleChangePassword,
  handleForgotPassword,
  isSavingProfile,
}) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <Shield size={20} style={{ marginRight: "0.5rem" }} /> Account
        Security
      </h2>
      <form
        onSubmit={handleChangePassword}
        className={styles.passwordChangeSection}
      >
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword" className={styles.label}>
            Current Password
          </label>
          <PasswordInputField
            password={currentPassword}
            setPassword={setCurrentPassword}
            id="currentPassword"
            name="currentPassword"
            placeholder="Enter your current password"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.label}>
            New Password
          </label>
          <PasswordInputField
            password={newPassword}
            setPassword={setNewPassword}
            id="newPassword"
            name="newPassword"
            placeholder="Minimum 10 characters"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmNewPassword" className={styles.label}>
            Confirm New Password
          </label>
          <PasswordInputField
            password={confirmNewPassword}
            setPassword={setConfirmNewPassword}
            id="confirmNewPassword"
            name="confirmNewPassword"
            placeholder="Type new password again"
            required
          />
        </div>

        <div className={styles.actionButtons}>
          <button
            type="submit"
            className={styles.button}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <button
          onClick={handleForgotPassword}
          className={`${styles.button} ${styles.secondary}`}
        >
          Forgot Password? Send Reset Link
        </button>
      </div>
    </section>
  );
};