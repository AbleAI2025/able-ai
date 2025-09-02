import React, { useState } from "react";
import { Check, Pencil, Plus } from "lucide-react";
import QualificationItem from "./QualificationItem";
import QualificationModal, { QualificationInput } from "./QualificationModal";
import styles from "./Qualifications.module.css";
import { Qualification } from "@/app/types";


interface QualificationsProps {
  initialQualifications: Qualification[];
  workerId: string;
  isSelfView: boolean;
}

const Qualifications = ({
  initialQualifications,
  workerId,
  isSelfView,
}: QualificationsProps) => {
  const [qualifications, setQualifications] = useState<Qualification[]>(initialQualifications || []);
  const [isEditMode, setIsEditMode] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const handleSave = (data: QualificationInput) => {
    const newQualification: Qualification = {
        ...data,
        id: `id-${Math.random().toString(36).substr(2, 9)}`, // Temporary ID
        workerProfileId: workerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        };
    if (modalMode === "add") {
        
      setQualifications([...qualifications, newQualification]);
    } else if (modalMode === "edit" && editingIndex !== null) {
        const updated = [...qualifications];
        updated[editingIndex] = {
        ...updated[editingIndex],
        ...data,
        updatedAt: new Date(),
        } as Qualification;
        setQualifications(updated);
    }
    setModalOpen(false);
    setIsEditMode(false);
  };

  const handleDelete = () => {
    if (editingIndex !== null) {
      setQualifications(qualifications.filter((_, i) => i !== editingIndex));
    }
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
          mode={modalMode}
          initialValue={editingIndex !== null ? qualifications[editingIndex] : null}
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
