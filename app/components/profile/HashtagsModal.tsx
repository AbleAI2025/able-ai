"use client";
import React, { useState } from "react";
import { X, Plus, Trash2, Pencil } from "lucide-react";
import styles from "./HashtagsModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { updateWorkerHashtagsAction } from "@/actions/user/gig-worker-profile";

interface HashtagsModalProps {
  initialValue: string[];
  onClose: () => void;
  fetchSkillData: () => void;
}

const HashtagsModal = ({
  initialValue,
  onClose,
  fetchSkillData,
}: HashtagsModalProps) => {
  const [hashtags, setHashtags] = useState<string[]>(initialValue || []);
  const [newTag, setNewTag] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const normalizeTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };

  const handleAddTag = () => {
    const cleanTag = normalizeTag(newTag);
    if (!cleanTag) return;
    if (hashtags.includes(cleanTag)) {
      setError("This hashtag already exists");
      return;
    }
    setHashtags([...hashtags, cleanTag]);
    setNewTag("");
    setError(null);
  };

  const saveEdit = (index: number) => {
    const cleanTag = normalizeTag(editingValue);
    if (!cleanTag) return;
    if (hashtags.some((tag, i) => i !== index && tag === cleanTag)) {
      setError("This hashtag already exists");
      return;
    }
    const updated = [...hashtags];
    updated[index] = cleanTag;
    setHashtags(updated);
    setEditingIndex(null);
    setEditingValue("");
    setError(null);
  };

  const handleRemoveTag = (index: number) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  const startEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleProfileUpdate = async () => {
    setIsSavingProfile(true);

    try {
      if (!user?.token) {
        throw new Error("Authentication required");
      }
      const { success: updateSuccess, error: updateError } =
        await updateWorkerHashtagsAction(user.token, hashtags);

      if (!updateSuccess) throw updateError;

      fetchSkillData();
      onClose();
      toast.success("Hashtags updated successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update hashtags.";
      setError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Edit Hashtags</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Input para agregar nuevo hashtag */}
          <div className={styles.tagInputRow}>
            <input
              type="text"
              placeholder="Enter new hashtag"
              value={newTag}
              className={styles.input}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className={styles.addButton}
            >
              <Plus size={20} />
              Add
            </button>
          </div>

          {/* Lista de hashtags editables */}
          <div className={styles.tagsList}>
            {hashtags.map((tag, index) => (
              <div key={index} className={styles.tagItem}>
                {editingIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={editingValue}
                      className={styles.input}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(index)}
                    />
                    <div className={styles.inlineButtons}>
                      <button
                        type="button"
                        onClick={() => saveEdit(index)}
                        className={styles.saveEditButton}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className={styles.cancelEditButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={styles.hashtag}>{tag}</span>
                    <button
                      type="button"
                      onClick={() => startEditing(index, tag)}
                      className={styles.editButton}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className={styles.removeButton}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={handleProfileUpdate}
            disabled={isSavingProfile}
            className={styles.saveButton}
          >
            {isSavingProfile ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HashtagsModal;
