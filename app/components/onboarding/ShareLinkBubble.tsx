import React, { useState } from 'react';
import styles from './ShareLinkBubble.module.css';
import { Share2 } from 'lucide-react';

interface ShareLinkBubbleProps {
  label?: string;
  linkUrl?: string; // Made optional for cases where link might not be ready
  linkText?: string;
  disabled?: boolean;
  onCopy?: (copiedText: string) => void;
}

const ShareLinkBubble: React.FC<ShareLinkBubbleProps> = ({
  linkUrl,
  linkText,
  disabled,
  onCopy
}) => {
  const [copied, setCopied] = useState(false);
  const displayLinkText = linkText || linkUrl;

  const handleCopy = async () => {
    if (disabled || !linkUrl || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      if (onCopy) onCopy(linkUrl);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  return (
    <div className={`${styles.shareLinkBubbleWrapper} ${styles.alignUser}`}>
      <div className={styles.shareLinkBubbleContent}>
        {/* {label && <p className={styles.label}>{label}</p>} */}
        <div className={styles.linkContainer}>
          {/* <Link size={16} className={styles.linkIcon} /> */}
          {linkUrl && displayLinkText ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.shareLink} ${disabled ? styles.disabledLink : ''}`}
              onClick={(e) => disabled && e.preventDefault()}
              title={linkUrl}
            >
              {displayLinkText}
            </a>
          ) : (
            <span className={styles.noLinkText}>{linkUrl ? displayLinkText : "No link available"}</span>
          )}
          {/* {linkUrl && navigator.clipboard && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={disabled}
              className={styles.copyButton}
              title="Copy link"
            >
              {copied ? <CheckCircle size={16} className={styles.copiedIcon} /> : <Copy size={16} />}
            </button>
          )} */}
          <Share2 color='#41a1e8' />
        </div>
      </div>
    </div>
  );
};

export default ShareLinkBubble;