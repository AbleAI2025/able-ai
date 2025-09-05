import { useState } from "react";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";
import CheckboxDisplayItem from "./CheckboxDisplayItem";
import styles from "./Equipments.module.css";
import { Equipment } from "@/app/types";
import AddEquipmentModal from "./EquipmentModal";
import { useAuth } from "@/context/AuthContext";
import { deleteEquipmentAction } from "@/actions/user/edit-worker-profile";
import { toast } from "sonner";

interface EquipmentProps {
  workerProfileId: string;
  equipments: Equipment[];
  isSelfView?: boolean;
  fetchUserProfile: (id: string) => void;
}

export default function Equipments({ workerProfileId, equipments, isSelfView, fetchUserProfile }: EquipmentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const handleAdd = () => {
    fetchUserProfile(user?.token || workerProfileId);
  };

  const handleRemove = async (id: string) => {
    await deleteEquipmentAction(id, user?.token);
    toast.success("Equipment removed successfully");
    fetchUserProfile(user?.token || workerProfileId);
    setIsEditing(false);
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.contentTitle}>Equipment:</h3>
        {isSelfView && (
          <div className={styles.actions}>
            {/* Add icon */}
            <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
              <Plus className={styles.icon} />
            </button>

            {/* Edit / Done toggle */}
            {equipments.length > 0 && (
              <button className={styles.editButton} onClick={() => setIsEditing((prev) => !prev)}>
                {isEditing ? (
                  <span className={styles.checkDone}>
                      <Check color="#ffffff" size={16} className={styles.icon} /> Done
                  </span>
              ) : (
                  <Pencil size={16} className={styles.icon} />
              )}
            </button>
            )}
          </div>
        )}    
      </div>

      {/* Equipment List */}
      <div className={styles.equipmentListContainer}>
        {equipments.length > 0 ? (
          equipments.map((item, index) => (
            <div key={item.id} className={styles.listItem}>
              <CheckboxDisplayItem label={item.name} />
              {isEditing && (
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 size={16} color="#ff0000" className={styles.icon} />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className={styles.feedbackText}>No equipment listed.</p>
        )}
      </div>

      {/* Inline add input (can also be modal) */}

      <AddEquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAdd}
      />
    </div>
  );
}
