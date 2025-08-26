import styles from "./GigStausIndicator.module.css";
import { getLastRoleUsed } from "@/lib/last-role-used";

interface GigStatusIndicatorProps {
  label: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
}

const GigStatusIndicator = ({
  label,
  isActive,
  isDisabled,
}: GigStatusIndicatorProps) => {
  const lastRoleUsed = getLastRoleUsed();
  return (
    <div
      className={`${styles.statusIndicator} ${
        isActive
          ? lastRoleUsed === "GIG_WORKER"
            ? styles.activeWorker
            : styles.activeBuyer
          : ""
      } ${isDisabled ? styles.disabled : ""}`}
    >
      {label}
    </div>
  );
};

export default GigStatusIndicator;
