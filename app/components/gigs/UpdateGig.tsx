import moment from "moment";
import { Pencil } from 'lucide-react';
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
}

function calculateHoursInRange(timeRangeString: string) {
	const parts = timeRangeString.split(' - ');

	if (parts.length !== 2) {
		throw new Error("Invalid time range format. Expected 'h:mm A - h:mm A'.");
	}

	const startTimeString = parts[0];
	const endTimeString = parts[1];
	const format = "h:mm A";

	let startTime = moment(startTimeString, format);
	let endTime = moment(endTimeString, format);

	if (!startTime.isValid() || !endTime.isValid()) {
		throw new Error("Invalid time format. Make sure the times are correct (e.g., '6:00 PM').");
	}

	if (endTime.isBefore(startTime)) {
		endTime = endTime.add(1, 'day');
	}

	const duration = moment.duration(endTime.diff(startTime));
	const totalHours = duration.asHours();

	return totalHours;
}

const AmendGig = ({ gigDetailsData, editedGigDetails, handleEditDetails, isEditingDetails, setEditedGigDetails, isOnConfirm }: GigDetailsProps) => {
	const lastRoleUsed = getLastRoleUsed()

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;

		setEditedGigDetails((prevState) => ({
			...prevState,
			[name]: value,
			...('payPerHour' === name ? { totalPay: (calculateHoursInRange(editedGigDetails.time) * Number(value)).toString() } : {}),
			...('time' === name ? { totalPay: (calculateHoursInRange(value) * Number(editedGigDetails.payPerHour)).toString() } : {})
		}));
	};

	return (
		<div className={styles.card}>
			<div className={styles.detailsHeader}>
				<h2 className={styles.detailsTitle}>
					{gigDetailsData.status === 'CANCELLED' ? 'Cancelled' : 'Updated'} gig details:
				</h2>
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
