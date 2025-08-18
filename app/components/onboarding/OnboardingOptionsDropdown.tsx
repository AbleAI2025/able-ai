import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, RefreshCw } from 'lucide-react';
import styles from './OnboardingOptionsDropdown.module.css';
interface OnboardingOptionsDropdownProps {
  onSwitchToManual: () => void;
  onChangeSetupMethod: () => void;
}

const OnboardingOptionsDropdown: React.FC<OnboardingOptionsDropdownProps> = ({
  onSwitchToManual,
  onChangeSetupMethod
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        className={styles.dropdownTrigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Onboarding options"
      >
        <MoreVertical size={20} />
      </button>
      
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button
            className={styles.dropdownOption}
            onClick={() => handleOptionClick(onSwitchToManual)}
          >
            <Edit size={16} />
            <span>Switch to Manual Form</span>
          </button>
          <button
            className={styles.dropdownOption}
            onClick={() => handleOptionClick(onChangeSetupMethod)}
          >
            <RefreshCw size={16} />
            <span>Change Setup Method</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingOptionsDropdown;
