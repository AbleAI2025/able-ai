import { useState } from "react";
import { X } from "lucide-react";
import styles from "./EquipmentModal.module.css";
import { toast } from "sonner";
import {
  addEquipmentAction,
  editEquipmentAction,
} from "@/actions/user/edit-worker-profile";
import { useAuth } from "@/context/AuthContext";

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function AddEquipmentModal({
  isOpen,
  onClose,
  onSave,
}: AddEquipmentModalProps) {
  const [equipmentName, setEquipmentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      if (!equipmentName.trim()) throw "Equipment name is required";
      const { success, error } = await addEquipmentAction(
        equipmentName,
        user?.token
      );
      if (!success) throw error;

      onSave();
      setEquipmentName("");
      toast.success("Equipment added successfully");
      onClose();
    } catch (error) {
      toast.error("Error adding equipment");
      console.error("Error adding equipment:", error);
    }
  };

  const handleChange = async () => {
    try {
      if (equipmentName.length > 50)
        throw "Equipment name cannot exceed 50 characters";
      const { success, error } = await editEquipmentAction(
        equipmentName,
        equipmentName,
        user?.token
      );

      if (!success) throw error;

      toast.success("Equipment updated successfully");
      onSave();
    } catch (error) {
      toast.error("Error editing equipment");
      console.error("Error editing equipment:", error);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Add Equipment</h3>
          <button
            onClick={() => {
              onClose();
              setError(null);
            }}
            className={styles.closeButton}
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <input
            type="text"
            value={equipmentName}
            onChange={(e) => setEquipmentName(e.target.value)}
            placeholder="Equipment name"
            className={styles.input}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button onClick={handleSave} className={styles.saveButton}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
