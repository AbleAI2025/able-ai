"use client";
// QualificationModal.tsx
import React, { useCallback, useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import styles from "./QualificationModal.module.css";
import { Qualification } from "@/app/types";
import { useAuth } from "@/context/AuthContext";
import {
  addQualificationAction,
  editQualificationAction,
  getAllSkillsAction,
} from "@/actions/user/edit-worker-profile";
import { toast } from "sonner";
export type QualificationInput = Pick<
  Qualification,
  "id" | "title" | "description"
>;

interface QualificationModalProps {
  mode: "add" | "edit";
  initialValue: QualificationInput | null;
  onSave: () => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  workerId: string;
  skillId?: string;
}

const QualificationModal = ({
  mode,
  initialValue,
  onSave,
  onDelete,
  onClose,
  workerId,
  skillId: currentSkillId,
}: QualificationModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialValue?.title || "");
  const [description, setDescription] = useState(
    initialValue?.description || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [allSkills, setAllSkills] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const fetchAllSkills = useCallback(async () => {
    // Fetch skills from the database or API
    try {
      if (!workerId) return;
      const { success, data } = await getAllSkillsAction(workerId);
      if (success && data) {
        setAllSkills(data);
      }
    } catch (error) {
      console.log("Error fetching skills", error);
    }
  }, [workerId]);
  useEffect(() => {
    if (currentSkillId) {
      setSkillId(currentSkillId);
    }
    fetchAllSkills();
  }, [currentSkillId, fetchAllSkills]);

  const handleSave = async () => {
    try {
      if (!title.trim() || !description.trim() || !user?.token || !skillId) {
        throw new Error(
          "Title, description, and skill are required to add a qualification."
        );
      }
      const { success, error } = await addQualificationAction(
        title,
        user?.token,
        skillId,
        description
      );

      if (!success) throw error;

      toast.success("Qualification added successfully");
      onSave();
    } catch (error) {
      toast.error("Error adding qualification");
      console.error("Error adding qualification:", error);
    }
  };
  const handleChange = async () => {
    try {
      if (!title.trim() || !description.trim())
        throw "Both title and description are required";

      const { success, error } = await editQualificationAction(
        initialValue?.id || "",
        title,
        user?.token,
        description
      );
      if (!success) throw error;

      toast.success("Qualification updated successfully");
      onSave();
    } catch (error) {
      toast.error("Error editing qualification");
      console.error("Error editing qualification:", error);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h4>{mode === "add" ? "Add Qualification" : "Edit Qualification"}</h4>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className={styles.body}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {!currentSkillId ? (
            <>
              <select
                className={styles.select}
                value={skillId || ""}
                onChange={(e) => setSkillId(e.target.value)}
              >
                <option value="" disabled>
                  Select a skill
                </option>
                {allSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {error && <p className={styles.errorText}>{error}</p>}
        </div>
        <div className={styles.footer}>
          {mode === "edit" && onDelete && (
            <button
              onClick={() => onDelete(initialValue?.id || "")}
              className={styles.deleteBtn}
            >
              <Trash2 size={16} /> Delete
            </button>
          )}
          <button
            onClick={mode === "add" ? handleSave : handleChange}
            className={styles.saveBtn}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualificationModal;
