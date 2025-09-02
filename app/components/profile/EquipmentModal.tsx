import { useState } from "react";
import { X } from "lucide-react";
import styles from "./EquipmentModal.module.css";

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function AddEquipmentModal({ isOpen, onClose, onSave }: AddEquipmentModalProps) {
  const [equipmentName, setEquipmentName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!equipmentName.trim()) {
      setError("Equipment name is required");
      return;
    }
    onSave(equipmentName.trim());
    setEquipmentName("");
    onClose();
  };

  const handleChange = (value: string) => {
    setEquipmentName(value.trim());
    if (error) {
      setError(null);
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
            onChange={(e) => handleChange(e.target.value)}
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
