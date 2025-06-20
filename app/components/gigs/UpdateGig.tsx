import { Pencil } from 'lucide-react';
import styles from './UpdateGig.module.css';
import { getLastRoleUsed } from '@/lib/last-role-used';

interface GigDetailsData {
    location: string;
    date: string;
    time: string;
    payPerHour: string;
    totalPay: string;
    summary: string; // Optional summary field
}

interface GigDetailsProps {
    editedGigDetails: GigDetailsData;
    handleEditDetails: () => void;
    setEditedGigDetails: React.Dispatch<React.SetStateAction<GigDetailsData>>;
    isEditingDetails?: boolean; // Optional prop to control edit mode
    gigDetailsData: GigDetailsData; // Assuming this is passed for read-only view
    isOnConfirm ?: boolean;
}

const AmendGig = ({gigDetailsData, editedGigDetails, handleEditDetails, isEditingDetails, setEditedGigDetails, isOnConfirm }: GigDetailsProps) => {
    const lastRoleUsed = getLastRoleUsed()

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
        const { name, value } = e.target;
        setEditedGigDetails((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };
    
    return (
        <div className={styles.card}>
            <div className={styles.detailsHeader}>
                <h2 className={styles.detailsTitle}>Updated gig details:</h2>
                <Pencil className={styles.editIcon} onClick={handleEditDetails} />
            </div>
            {isEditingDetails ? (
            /* Editable Form View */
            <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Location:</span>
                <input
                    type="text"
                    name="location"
                    value={editedGigDetails.location}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                    disabled={lastRoleUsed === "GIG_WORKER"} // Disable for workers
                />
                </div>
                <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Date:</span>
                <input
                    type="text"
                    name="date"
                    value={editedGigDetails.date}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                    disabled={lastRoleUsed === "GIG_WORKER"} // Disable for workers
                />
                </div>
                <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Time:</span>
                <input
                    type="text"
                    name="time"
                    value={editedGigDetails.time}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                />
                </div>
                <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>Pay per hour:</span>
                <input
                    type="text"
                    name="payPerHour"
                    value={editedGigDetails.payPerHour}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                    disabled={lastRoleUsed === "GIG_WORKER"} // Disable for workers
                />
                </div>
                <div className={styles.detailItem}>
                <span className={styles.detailItemLabel}>{lastRoleUsed === "BUYER" ? "Total Cost:" : "Total Pay:"}</span>
                <input
                    type="text"
                    name="totalPay"
                    value={editedGigDetails.totalPay}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                    disabled={true} // Total pay likely calculated
                />
                </div>
                {/* Summary might be recalculated or hidden in edit mode */}
                {/* <p className={styles.detailsSummaryText}>{editedGigDetails.summary}</p> */}
            </div>
            ) : (
            /* Read-only View */
            <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                    <span className={styles.detailItemLabel}>Location:</span>
                    <span className={styles.detailItemValue}>
                        {gigDetailsData.location}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailItemLabel}>Date:</span>
                    <span className={styles.detailItemValue}>
                        {gigDetailsData.date}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailItemLabel}>Time:</span>
                    <span className={styles.detailItemValue}>
                        {gigDetailsData.time}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailItemLabel}>Pay per hour:</span>
                    <span className={styles.detailItemValue}>
                        &#8364;{gigDetailsData.payPerHour}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailItemLabel}>{lastRoleUsed === "BUYER" ? "Total Cost:" : "Total Pay:"}</span>
                    <span className={styles.detailItemValue}>
                        &#8364;{gigDetailsData.totalPay}
                    </span>
                </div>
            </div>
            )}
            {/* Always show summary in read-only mode, maybe hide in edit mode */}
            {!isEditingDetails && !isOnConfirm && (
            <p className={styles.detailsSummaryText}>
                {gigDetailsData.summary}
            </p>
            )}
        </div>
    )
}

export default AmendGig
