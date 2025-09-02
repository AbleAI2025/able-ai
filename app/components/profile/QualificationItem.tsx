// QualificationListItem.tsx
import React from "react";
import { Pencil } from "lucide-react";
import styles from "./QualificationItem.module.css";
import { Qualification } from "@/app/types";


interface QualificationItemProps {
  qualification: Qualification;
  isEditMode: boolean;
  onEdit: () => void;
}

const QualificationItem = ({
  qualification,
  isEditMode,
  onEdit,
}: QualificationItemProps) => {
  return (
    <li className={styles.item}>
      <div className={styles.itemContent}>
        <strong>{qualification.title}</strong>: {qualification.description}
      </div>
      {isEditMode && (
        <button onClick={onEdit} className={styles.editIcon}>
          <Pencil size={14} />
        </button>
      )}
    </li>
  );
};

export default QualificationItem;
