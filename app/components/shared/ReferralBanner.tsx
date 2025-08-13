// app/components/shared/ReferralBanner.tsx
import React, { useEffect, useState } from 'react';
import styles from './ReferralBanner.module.css';
import { Gift } from 'lucide-react'; // Example icon
import { useAuth } from '@/context/AuthContext';
import { is } from 'drizzle-orm';

interface ReferralBannerProps {
  className?: string;
}

const ReferralBanner: React.FC<ReferralBannerProps> = ({ className }) => {
  const [tooltipText, setTooltipText] = useState("Click to copy");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // const [isMobile, setIsMobile] = useState(false);
  

  const copyToClipboard = (text: string) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
};

const fallbackCopy = (text: string) => {
  const input = document.createElement("input");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};

// Updated handleReferralClick
const handleReferralClick = () => {
  const referralLink = "https://example.com/referral"; // replace with actual link

  // Copy to clipboard using helper
  copyToClipboard(referralLink);

  // Show tooltip / toast
  setTooltipText("Copied!");
  setTooltipVisible(true);

  // Hide tooltip after 2 seconds
  setTimeout(() => {
    setTooltipText("Click to copy");
    setTooltipVisible(false);
  }, 2000);

  console.log("Referral link copied to clipboard");
};


// useEffect(() => {
//   const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
//   setIsMobile(mobileCheck);
// }, []);

  return (
    <button 
      className={`${styles.banner} ${styles.button} ${className}`}
      onClick={handleReferralClick}
    >
      <div className={styles.iconWrapper}>
        <Gift size={24} />
      </div>
      <div className={styles.textWrapper}>
        <h4 className={styles.title}>Refer a business and earn £5!</h4>
      </div>
       <span className={`${styles.tooltip} ${tooltipVisible ? styles.show : ''}`}>
          {tooltipText}
        </span>
    </button>
  );
};
export default ReferralBanner;