"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import styles from "./ViewImagesModal.module.css";
import { toast } from "sonner";
import { deleteImageAction } from "@/actions/user/gig-worker-profile";

interface ViewImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  userToken: string;
  skillId: string;
  isSelfView: boolean;
  fetchSkillData: () => void;
}

const ViewImageModal: React.FC<ViewImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  isSelfView,
  fetchSkillData,
  userToken, 
  skillId,
}) => {
  if (!isOpen) return null;
  console.log(imageUrl);

  const handleDelete = async () => {
    try {
      await deleteImageAction(userToken, skillId, imageUrl);

      fetchSkillData();
      onClose();
      toast.success("Image deleted successfully");
    } catch (err) {
      console.error("Error deleting image", err);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>
        <div className={styles.imageWrapper}>
          <Image
            src={imageUrl}
            alt="Selected Image"
            width={0}
            height={0}
            sizes="100vw"
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          />
        </div>
        {isSelfView && (
          <button className={styles.deleteButton} onClick={handleDelete}>
            Delete Image
          </button>
        )}
      </div>
    </div>
  );
};

export default ViewImageModal;
