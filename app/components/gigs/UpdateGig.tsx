import { Pencil, X } from 'lucide-react';
import styles from './UpdateGig.module.css';
import { getLastRoleUsed } from '@/lib/last-role-used';
import { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';

interface GigDetailsProps {
	editedGigDetails: GigReviewDetailsData;
	handleEditDetails: () => void;
	setEditedGigDetails: React.Dispatch<React.SetStateAction<GigReviewDetailsData>>;
	isEditingDetails?: boolean; // Optional prop to control edit mode
	gigDetailsData: GigReviewDetailsData; // Assuming this is passed for read-only view
	isOnConfirm?: boolean;
	title: string;
}

const AmendGig = ({ gigDetailsData, editedGigDetails, handleEditDetails, isEditingDetails, setEditedGigDetails, isOnConfirm, title }: GigDetailsProps) => {
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
				<h2 className={styles.detailsTitle}>
					{title}
					{/* Uncomment if you want to show status */}
					{/* {gigDetailsData.status === 'CANCELLED' ? 'Cancelled' : 'Updated'} gig details: */}
				</h2>
				{!isEditingDetails ? (
					<Pencil className={styles.editIcon} onClick={handleEditDetails} />
				) : (
					<X className={styles.editIcon} onClick={handleEditDetails} />
				)}
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
