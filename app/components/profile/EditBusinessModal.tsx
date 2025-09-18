import { useState } from "react";
import styles from "./EditBusinessModal.module.css";
import LocationPickerBubble from "../onboarding/LocationPickerBubble";

import { MapPin, X } from "lucide-react";

interface Location {
   formatted_address: string;
   lat: number | undefined;
   lng: number | undefined;
 }

interface EditBusinessModalProps {
  initialData: {
    fullCompanyName: string;
    location: Location;
    companyRole: string;
  };
  onSave: (data: {
    fullCompanyName: string;
    location: Location;
    companyRole: string;
  }) => void;
  onClose: () => void;
}

export default function EditBusinessModal({
  initialData,
  onSave,
  onClose,
}: EditBusinessModalProps) {
  const [form, setForm] = useState(initialData);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Business Info</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Business name */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Business Name</label>
          <input
            type="text"
            name="fullCompanyName"
            value={form.fullCompanyName}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* Location */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Location</label>
          <div className={styles.locationRow}>
            <button
              type="button"
              className={styles.mapBtn}
              onClick={() => setShowLocationPicker(!showLocationPicker)}
            >
              <MapPin size={18} />
              <span>
                {form?.location?.formatted_address || "Pick a location"}
              </span>
            </button>
          </div>

          {/* Location Picker as Modal */}
          {showLocationPicker && (
            <div className={styles.locationPickerBackdrop}>
              <div className={styles.locationPickerContent}>
                <div className={`${styles.modalHeader} ${styles.pickerHeader}`}>
                  <button
                    className={`${styles.closeBtn} ${styles.pickerCloseBtn}`}
                    onClick={() => setShowLocationPicker(false)}
                  >
                    <X className={styles.closeIcon} />
                  </button>
                </div>
                <LocationPickerBubble
                  value={form.location.formatted_address}
                  onChange={(loc) =>
                    setForm({
                      ...form,
                      location: {
                        formatted_address: loc.formatted_address,
                        lat: loc.lat,
                        lng: loc.lng,
                      }
                    })
                  }
                  showConfirm
                  onConfirm={() => setShowLocationPicker(false)}
                  role="BUYER"
                />
              </div>
            </div>
          )}
        </div>

        {/* Role */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Role</label>
          <input
            type="text"
            name="companyRole"
            value={form.companyRole}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button onClick={handleSave} className={styles.saveBtn}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
