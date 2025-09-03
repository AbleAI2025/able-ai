// QualificationModal.tsx
import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";
import styles from "./QualificationModal.module.css";
import { Qualification } from "@/app/types";

export type QualificationInput = Pick<Qualification, "title" | "description">;


interface QualificationModalProps {
  mode: "add" | "edit";
  initialValue: QualificationInput | null;
  onSave: (data: QualificationInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const QualificationModal = ({
  mode,
  initialValue,
  onSave,
  onDelete,
  onClose,
}: QualificationModalProps) => {
  const [title, setTitle] = useState(initialValue?.title || "");
  const [description, setDescription] = useState(initialValue?.description || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    onSave({ title, description });
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
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
        <div className={styles.footer}>
          {mode === "edit" && onDelete && (
            <button onClick={onDelete} className={styles.deleteBtn}>
              <Trash2 size={16} /> Delete
            </button>
          )}
          <button onClick={handleSave} className={styles.saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualificationModal;
