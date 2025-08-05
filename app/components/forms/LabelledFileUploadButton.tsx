import React from 'react';
import { Paperclip } from 'lucide-react';
import styles from './LabelledFileUploadButton.module.css';

interface LabelledFileUploadButtonProps {
  label: string;
  onFilesSelected: (files: FileList | null) => void;
}

const LabelledFileUploadButton: React.FC<LabelledFileUploadButtonProps> = ({ label, onFilesSelected }) => {
  const [fileCount, setFileCount] = React.useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileCount(e.target.files?.length || 0);
    onFilesSelected(e.target.files);
  };

  return (
    <>
      <span className={styles.fieldLabel}>Attach Files</span>
      <div className={styles.fileUploadButton}>
        <input
          type="file"
          id="fileUpload"
          multiple
          onChange={handleChange}
          className={styles.fileInputHidden}
        />
        <label htmlFor="fileUpload" className={styles.fileUploadLabel}>
          {fileCount > 0 ? `${fileCount} file(s) selected` : label}
          <Paperclip size={20} className={styles.fileUploadIcon} />
        </label>
      </div>
    </>
    
  );
};
export default LabelledFileUploadButton; 