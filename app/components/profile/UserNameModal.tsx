// UserNameModal.tsx
"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./EquipmentModal.module.css";
import { updateUserProfileAction } from "@/actions/user/user";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface UserNameModalProps {
  userId: string;
  initialValue: string;
  onClose: () => void;
  fetchUserProfile: (id: string) => void;
}

const UserNameModal = ({ initialValue, onClose, fetchUserProfile, userId }: UserNameModalProps) => {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth()
  const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleProfileUpdate = async (displayName: string) => {
      setIsSavingProfile(true);

      try {
        const { success: updateSuccess, error: updateError } = await updateUserProfileAction(
          { fullName: displayName },
          user?.token
        );
  
        if (!updateSuccess) throw updateError;
  
        fetchUserProfile(user?.token || userId);
        onClose();
  
        toast.success("Profile updated successfully");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update profile.";
        setError(message);
      } finally {
        setIsSavingProfile(false);
      }
    };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h4>Update Name</h4>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <input
            type="text"
            placeholder="Enter new name"
            value={name}
            className={styles.input}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button onClick={() => handleProfileUpdate(name)} className={styles.saveButton}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNameModal;
