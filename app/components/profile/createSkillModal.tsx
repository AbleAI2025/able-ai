"use client";
"use client";

import React, { useState } from "react";
import { createSkillWorker } from "@/actions/user/gig-worker-profile";
import styles from "./SkillsDisplayTable.module.css";

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillCreated: () => void;
  token: string;
}

const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  onSkillCreated,
  token,
}) => {
  const [name, setName] = useState("");
  const [experienceMonths, setExperienceMonths] = useState<number | undefined>();
  const [agreedRate, setAgreedRate] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!agreedRate || !experienceMonths) throw "fields are required";

    const result = await createSkillWorker(token, {
      name,
      experienceMonths,
      agreedRate,
    });
    setLoading(false);

    if (result.success) {
      onSkillCreated();
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
            Experience (months):
            <input
              type="number"
              value={experienceMonths}
              onChange={(e) => setExperienceMonths(Number(e.target.value))}
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
