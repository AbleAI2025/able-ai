import { getLastRoleUsed } from "@/lib/last-role-used";
import styles from './GigAmendmentSections.module.css';
import Logo from "../brand/Logo";
import { getPublicWorkerProfileAction } from "@/actions/user/gig-worker-profile";
import { useEffect, useState } from "react";

type GigAmendmentActionsProps = {
  handleSubmit: () => void;
  handleCancel: () => void;
  isSubmitting: boolean;
  isCancelling: boolean;
  existingAmendmentId: string | null;
};

type AmendmentReasonSectionProps = {
  reason: string;
  onReasonChange: (reason: string) => void;
  isDisabled?: boolean;
  workerId: string | undefined;
};

export const GigAmendmentActions = ({
  handleSubmit,
  handleCancel,
  isSubmitting,
  isCancelling,
  existingAmendmentId,
}: GigAmendmentActionsProps) => {
  const lastRoleUsed = getLastRoleUsed();

  const isProcessing = isSubmitting || isCancelling;

  return (
    <div className={styles.actionBtnContainer}>
      <button
        type="button"
        className={`${styles.submitButton} ${lastRoleUsed === "GIG_WORKER" ? styles.workerBtn : styles.buyerBtn}`}
        onClick={handleSubmit}
        disabled={isProcessing}
      >
        {isSubmitting ? 'Submitting...' : 'Submit for confirmation'}
      </button>

      <button
        type="button"
        className={styles.cancelButton}
        onClick={handleCancel}
        disabled={isProcessing}
      >
        {isCancelling ? 'Withdrawing...' : (existingAmendmentId ? 'Withdraw Amendment' : 'Cancel Edit')}
        <p>(This might incur charges or penalties)</p>
      </button>
    </div>
  );
};

export const AmendmentReasonSection = ({
  reason,
  onReasonChange,
  isDisabled = false,
  workerId
}: AmendmentReasonSectionProps) => {
  const [workerName, setWorkerName] = useState('Reason')

  useEffect(() => {
    const getWorkerName = async () => {
      if (!workerId) return;
      try {
        const { data } = await getPublicWorkerProfileAction(workerId, true);
        setWorkerName(data.user?.fullName || 'Reason');
      } catch (err) {
        console.error("Failed to get worker name:", err);
      }
    }
    getWorkerName();
  }, [workerId])

  return <section className={styles.card}>
    <label htmlFor="reasonMessage" className={styles.textInputBlockLabel}>
    {workerName}:
    </label>
    <textarea
      id="reasonMessage"
      name="reasonMessage"
      className={styles.textareaInput}
      value={reason}
      onChange={(e) => onReasonChange(e.target.value)}
      placeholder="e.g., Add one more hour to the gig or pay £22ph."
      required
      disabled={isDisabled}
    />
  </section>
}

export const AmendmentDummyChatbot = () => {
  return <section className={`${styles.card} ${styles.instructionBlock}`}>
    <Logo width={80} height={60} />
    <p className={styles.instructionText}>
      What changes would you like to make to the gig? Tell me or edit using the icon below
    </p>
  </section>

}
