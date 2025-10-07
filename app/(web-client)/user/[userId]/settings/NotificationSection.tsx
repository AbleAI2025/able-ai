import React from "react";
import SwitchControl from "@/app/components/shared/SwitchControl";
import styles from "./SettingsPage.module.css";

interface NotificationSectionProps {
  notificationEmail: boolean;
  handleToggleEmailNotification: () => void;
  notificationSms: boolean;
  handleToggleSmsNotification: () => void;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
  notificationEmail,
  handleToggleEmailNotification,
  notificationSms,
  handleToggleSmsNotification,
}) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Notification Preferences</h2>
      <SwitchControl
        id="emailNotification"
        label="Email Notifications"
        checked={notificationEmail}
        onCheckedChange={() => handleToggleEmailNotification()}
      />
      <SwitchControl
        id="smsNotification"
        label="SMS Notifications"
        checked={notificationSms}
        onCheckedChange={() => handleToggleSmsNotification()}
      />
    </section>
  );
};