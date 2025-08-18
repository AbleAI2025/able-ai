import {
  AlertTriangle,
  X,
} from "lucide-react";
import styles from './stripeModal.module.css';
import PaymentSetupForm from "./PaymentSetupForm";
import { FlowStep, UserRole } from "@/app/types/SettingsTypes";
import RoleToggle from "../shared/RoleToggle";

const StripeModal = ({
  userId,
  userRole,
  connectionStep,
  isConnectingStripe,
  handleCloseModal,
  handleOpenStripeConnection,
}: {
  userId: string;
  userRole: UserRole;
  connectionStep: FlowStep;
  isConnectingStripe: boolean;
  handleCloseModal: () => void;
  handleOpenStripeConnection: () => void;
}) => {
  return (
    <div
      className={styles.modalOverlay}
      onClick={handleCloseModal}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderContent}>
            <div className={styles.stripeIconWrapper}>
              <AlertTriangle size={25} color="#ffc107" />
            </div>
            <h3 className={styles.modalTitle}>
              {
                userRole === 'BUYER' ?
                  'Pay Securely with Stripe!' :
                  'Get Paid with Stripe!'
              }
            </h3>
          </div>
          <button
            onClick={handleCloseModal}
            className={styles.closeButton}
            aria-label="Close"
          >
           <X color="#ffffff" size={25} />
          </button>
        </div>
        {
          userRole === 'BUYER' ?
            <p>
              To pay for your services, you'll do so through our payment provider, Stripe.
              Stripe ensures your transactions are secure, free, and processed quickly.
            </p>
            :
            <p>
              To receive payments for your gigs, you must connect your bank
              account through our payment provider, Stripe. This is secure,
              free, and only takes a minute.
            </p>
        }
        {
          connectionStep === 'connecting' &&
          <>
            <div className={styles.modalActions}>
              <button
                onClick={handleOpenStripeConnection}
                className={`${styles.stripeButton} ${userRole === 'BUYER' ? styles.buyerBtn : styles.workerBtn}`}
                disabled={isConnectingStripe}
              >
                {isConnectingStripe
                  ? "Connecting..."
                  : "Connect My Bank Account"}
              </button>
            </div>
            <div
              className={styles.connectionStatus}
            >
              <AlertTriangle size={20} color="#ffc107" />
              <p>Not connected</p>
            </div>
          </>
        }
        {
          connectionStep === 'payment-method' &&
          <div>
            <PaymentSetupForm userId={userId} />
          </div>
        }
      </div>
    </div>
  )
}

export default StripeModal;
