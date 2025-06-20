import React from 'react';
import styles from './StripeLinkBubble.module.css';
import Link from 'next/link';

interface StripeLinkBubbleProps {
    id?: string;
    name?: string;
    label?: string;
    stripeLink?: string;
    disabled?: boolean;
}

const StripeLinkBubble: React.FC<StripeLinkBubbleProps> = ({ label, stripeLink, disabled }) => {
    // This is a mock implementation. Replace with a real Stripe onboarding link later.
    return (
        <div className={styles.stripeLinkBubbleWrapper}>
            {/* {label && <label htmlFor={id || name} className={styles.label}>{label}</label>} */}
            <div className={styles.stripeLinkPlaceholder}>
                {/* <p>[Stripe Onboarding Link Placeholder]</p> */}
                {stripeLink ? (
                    <Link
                        href={stripeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={disabled ? styles.disabledLink : ""}
                    >
                        {label}
                    </Link>
                ) : (
                    <p>No Stripe link available.</p>
                )}
            </div>
        </div>
    );
};

export default StripeLinkBubble;