"use client";
"use client";

import React, { useState } from "react";
import { createSkillWorker } from "@/actions/user/gig-worker-profile";
import styles from "./SkillsDisplayTable.module.css";
import { useAuth } from "@/context/AuthContext";

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillCreated: () => void;
  token: string;
  fetchUserProfile: (token: string) => void;
}

const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onSkillCreated,
  fetchUserProfile,
  token,
}) => {
  const [name, setName] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | undefined>();
  const [agreedRate, setAgreedRate] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const {user} = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!agreedRate || !experienceYears) throw "fields are required";

    if (!user) throw "User not authenticated";

    const result = await createSkillWorker(token, {
      name,
      experienceYears,
      agreedRate,
    });
    setLoading(false);

    if (result.success) {
      onSkillCreated();
      fetchUserProfile(user.token);
      onClose();
    } else {
      alert("Error creating skill: " + result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Add New Skill</h3>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label>
            Skill Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Experience (years):
            <input
              type="number"
              step="0.1"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              required
            />
          </label>
          <label>
            £ per hour:
            <input
              type="number"
              value={agreedRate}
              onChange={(e) => setAgreedRate(Number(e.target.value))}
              required
            />
          </label>
          <div className={styles.modalButtons}>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Skill"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSkillModal;
