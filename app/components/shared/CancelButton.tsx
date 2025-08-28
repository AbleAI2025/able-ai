import { X } from 'lucide-react'
import styles from './CancelButton.module.css'

interface CancelButtonProps {
  handleCancel: () => void
}

const CancelButton = ({ handleCancel }: CancelButtonProps) => {
  return (
    
    <button
        onClick={handleCancel}
        className={styles.cancelButton}
    >
        <X size={18} />
    </button>
   
  )
}

export default CancelButton
