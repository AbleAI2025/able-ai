import React from "react";
import InputField from "@/app/components/form/InputField";
import { Save } from "lucide-react";
import styles from "./SettingsPage.module.css";
import { User } from "@/context/AuthContext";

interface ProfileSectionProps {
  displayName: string;
  setDisplayName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  handleProfileUpdate: (event: React.FormEvent) => void;
  isSavingProfile: boolean;
  user: User | null;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  displayName,
  setDisplayName,
  phone,
  setPhone,
  handleProfileUpdate,
  isSavingProfile,
  user,
}) => {
  return (
    <section className={styles.section} id="profile-information">
      <h2 className={styles.sectionTitle}>Personal Information</h2>
      <form onSubmit={handleProfileUpdate} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="displayName" className={styles.label}>
            Full Name
          </label>
          <InputField
            id="displayName"
            name="displayName"
            type="text"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDisplayName(e.target.value)
            }
            placeholder="Your display name"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user?.email || ""}
            readOnly
            disabled
            className={styles.inputField}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="phone" className={styles.label}>
            Phone
          </label>
          <InputField
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
            placeholder="Your phone number"
          />
        </div>
        <div className={styles.actionButtons}>
          <button
            type="submit"
            className={styles.button}
            disabled={isSavingProfile}
          >
            <Save size={16} />{" "}
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </section>
  );
};