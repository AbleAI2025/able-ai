import { Edit2 } from "lucide-react";
import styles from "../BuyerProfilePage.module.css";
import DashboardData from "@/app/types/BuyerProfileTypes";

interface HeaderProps {
  dashboardData: DashboardData;
  onEditName: () => void;
  onEditSocialLink: () => void;
}

export default function Header({ dashboardData, onEditName, onEditSocialLink }: HeaderProps) {
  return (
    <header className={styles.profileHeader}>
      <h3 className={styles.profileHeaderName}>
        {dashboardData.fullName}
        <button
          className={styles.editButton}
          type="button"
          aria-label="Edit name"
          onClick={onEditName}
        >
          <Edit2 size={16} color="#ffffff" className={styles.icon} />
        </button>
      </h3>
      <p className={styles.profileHeaderUsername}>
        {dashboardData?.socialLink}
        <button
          className={styles.editButton}
          type="button"
          aria-label="Edit social link"
          onClick={onEditSocialLink}
        >
          <Edit2 size={14} color="#ffffff" className={styles.icon} />
        </button>
      </p>
    </header>
  );
}