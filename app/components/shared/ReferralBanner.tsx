import React, { useRef, useState, useEffect } from 'react';
import styles from './ReferralBanner.module.css';
import { Gift, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/firebase/clientApp';
import { getUserReferralCodeAction } from '@/actions/user/user';

interface ReferralBannerProps {
  role?: string;
}

const ReferralBanner: React.FC<ReferralBannerProps> = ({ role }) => {
  const [tooltipText, setTooltipText] = useState("");
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
    };
  }, []);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    fallbackCopy(text);
    return Promise.resolve();
  };

  const fallbackCopy = (text: string) => {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  };

  const handleReferralClick = async () => {
    if (isCopying) return;

    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }

    setIsCopying(true);

    const user = authClient.currentUser;
    if (!user) {
      setTooltipText("Please log in to get your link");
      setIsTooltipVisible(true);
      tooltipTimeout.current = setTimeout(() => setIsTooltipVisible(false), 3000);
      setIsCopying(false);
      return;
    }

    try {
      const result = await getUserReferralCodeAction({ firebaseUid: user.uid });
      if (!result || !result.code) throw new Error("Discount code not found");

      const referralLink = `${window.location.origin}/?code=${result.code}`;
      await copyToClipboard(referralLink);

      setTooltipText(`Referral link ready with discount code ${result.code}`);
      setIsTooltipVisible(true);
    } catch (error) {
      console.error("Failed to copy referral link:", error);
      setTooltipText("Could not get link. Try again.");
      setIsTooltipVisible(true);
    } finally {
      setIsCopying(false);
      tooltipTimeout.current = setTimeout(() => {
        setIsTooltipVisible(false);
      }, 3000);
    }
  };

  return (
    <button
      className={`${styles.banner} ${styles.button} ${role === 'BUYER' ? styles.buyer : ''} ${isCopying ? styles.loading : ''}`}
      onClick={handleReferralClick}
      disabled={isCopying}
      aria-describedby="referral-tooltip"
    >
      <div className={styles.iconWrapper}>
        {isCopying ? <Loader2 size={24} className={styles.spinner} /> : <Gift size={24} />}
      </div>
      <div className={styles.textWrapper}>
        <h4 className={styles.title}>Refer a business and earn £5!</h4>
      </div>
      <span
        id="referral-tooltip"
        role="tooltip"
        className={`${styles.tooltip} ${isTooltipVisible ? styles.show : ''}`}
      >
        {tooltipText}
      </span>
    </button>
  );
};

export default ReferralBanner;
