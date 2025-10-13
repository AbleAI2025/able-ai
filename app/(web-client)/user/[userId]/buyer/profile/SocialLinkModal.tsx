// SocialLinkModal.tsx
"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./SocialLinkModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SocialLinkModalProps {
  initialValue?: string;
  onClose: () => void;
  fetchUserProfile: () => void;
  updateAction: (link: string, token: string) => Promise<{ success: boolean; error?: string }>;
}

const SocialLinkModal = ({ initialValue, onClose, fetchUserProfile, updateAction }: SocialLinkModalProps) => {
  const [socialLink, setSocialLink] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleProfileUpdate = async (link?: string) => {
    setIsSavingProfile(true);
    try {
      if (!link || link.trim() === "") {
        setError("Social link cannot be empty.");
        setIsSavingProfile(false);
        return;
      }
      if (!user?.token) {
        throw new Error("Authentication token is required");
      }
      const { success: updateSuccess, error: updateError } = await updateAction(link, user.token);

      if (!updateSuccess) throw updateError;

      fetchUserProfile();
      onClose();
      toast.success("Social link updated successfully");
    } catch (err: unknown) {
      const message = typeof err === 'string' ? err : (err instanceof Error ? err.message : "Failed to update social link.");
      setError(message);
      toast.error("Error updating social link: " + message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h4>Update Social Link</h4>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <input
            type="text"
            placeholder="Enter your social link (e.g. @username or https://...)"
            value={socialLink}
            className={styles.input}
            onChange={(e) => setSocialLink(e.target.value)}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button
            disabled={isSavingProfile}
            onClick={() => handleProfileUpdate(socialLink)}
            className={styles.saveButton}
          >
            {isSavingProfile ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialLinkModal;
