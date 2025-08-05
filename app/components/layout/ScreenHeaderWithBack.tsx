import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './ScreenHeaderWithBack.module.css';

interface ScreenHeaderWithBackProps {
  title: string;
  onBackClick: () => void;
}

const ScreenHeaderWithBack: React.FC<ScreenHeaderWithBackProps> = ({ title, onBackClick }) => {
  return (
    <header className={styles.header}>
      <button onClick={onBackClick} className={styles.backButton} aria-label="Go back">
        <ArrowLeft size={20}/>
      </button>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
};
export default ScreenHeaderWithBack; 