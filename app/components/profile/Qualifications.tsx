"use client";
import React, { useState } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import QualificationItem from "./QualificationItem";
import QualificationModal from "./QualificationModal";
import styles from "./Qualifications.module.css";
import { Qualification } from "@/app/types";
import { useAuth } from "@/context/AuthContext";
import {
  deleteQualificationAction,
} from "@/actions/user/edit-worker-profile";

interface QualificationsProps {
  qualifications: Qualification[];
  workerId: string;
  isSelfView: boolean;
  fetchUserProfile: (id: string) => void;
  skillId?: string;
}

const Qualifications = ({
  qualifications,
  isSelfView,
  workerId,
  fetchUserProfile,
  skillId,
}: QualificationsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { user } = useAuth();

  const openAddModal = () => {
    setModalMode("add");
    setEditingIndex(null);
    setModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setModalMode("edit");
    setEditingIndex(index);
    setModalOpen(true);
  };

  const handleSave = () => {
    fetchUserProfile(user?.token || workerId);
    setModalOpen(false);
    setIsEditMode(false);
  };

  const handleDelete = async (id: string) => {
    await deleteQualificationAction(id, user?.token);
    fetchUserProfile(user?.token || workerId);
    setModalOpen(false);
    setIsEditMode(false);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.contentTitle}>
        Qualifications
        {isSelfView && (
          <div className={styles.actions}>
            <button onClick={openAddModal}>
              <Plus size={16} />
            </button>
            {qualifications.length > 0 && (
              <button
                onClick={() => setIsEditMode((prev) => !prev)}
                className={styles.editButton}
              >
                {isEditMode ? (
                  <span className={styles.checkDone}>
                    <Check size={16} color="#ffffff" /> Done
                  </span>
                ) : (
                  <Pencil size={16} />
                )}
              </button>
            )}
          </div>
        )}
      </h3>

      <ul className={styles.listSimple}>
        {qualifications.length > 0 ? (
          qualifications.map((q, index) => (
            <QualificationItem
              key={q.id}
              qualification={q}
              isEditMode={isEditMode}
              onEdit={() => openEditModal(index)}
            />
          ))
        ) : (
          <li>No qualifications listed.</li>
        )}
      </ul>

      {modalOpen && (
        <QualificationModal
          skillId={skillId}
          mode={modalMode}
          initialValue={
            editingIndex !== null ? qualifications[editingIndex] : null
          }
          workerId={workerId}
          onSave={handleSave}
          onDelete={modalMode === "edit" ? handleDelete : undefined}
          onClose={() => {
            setModalOpen(false);
            setIsEditMode(false);
          }}
        />
      )}
    </div>
  );
};

export default Qualifications;
