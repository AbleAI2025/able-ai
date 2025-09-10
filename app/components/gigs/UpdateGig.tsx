import { Pencil, X } from 'lucide-react';
import styles from './UpdateGig.module.css';
import { getLastRoleUsed } from '@/lib/last-role-used';
import { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';
import { calculateHoursInRange } from "@/utils/calculate-hours";

interface GigDetailsProps {
	editedGigDetails: GigReviewDetailsData;
	handleEditDetails: () => void;
	setEditedGigDetails: React.Dispatch<React.SetStateAction<GigReviewDetailsData>>;
	isEditingDetails?: boolean;
	isOnConfirm?: boolean;
	title: string;
}

const AmendGig = ({ editedGigDetails, handleEditDetails, isEditingDetails, setEditedGigDetails, isOnConfirm, title }: GigDetailsProps) => {
	const lastRoleUsed = getLastRoleUsed()

	const convertTo12Hour = (time24: string): string => {
		const [hours, minutes] = time24.split(':');
		const hour = parseInt(hours, 10);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	};

	const parseTimeRange = (timeRange: string) => {
		const match = timeRange.match(/(\d{1,2}:\d{2}\s?(AM|PM))\s?-\s?(\d{1,2}:\d{2}\s?(AM|PM))/i);
		if (match) {
			return {
				startTime: match[1],
				endTime: match[3]
			};
		}
		return { startTime: '', endTime: '' };
	};

	const convertTo24Hour = (time12: string): string => {
		const match = time12.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
		if (!match) return '';
		
		const [, hours, minutes, ampm] = match;
		let hour = parseInt(hours, 10);
		
		if (ampm.toUpperCase() === 'PM' && hour !== 12) {
			hour += 12;
		} else if (ampm.toUpperCase() === 'AM' && hour === 12) {
			hour = 0;
		}
		
		return `${hour.toString().padStart(2, '0')}:${minutes}`;
	};

	const updateSummary = (totalPay: string) => {
		const fees = (parseFloat(totalPay) * 0.1).toFixed(2);
		return `Total gig value is now £${totalPay}, with Able and payment provider fees of £${fees}.`;
	};

	const { startTime, endTime } = parseTimeRange(editedGigDetails.time || '');

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;

		setEditedGigDetails((prevState) => {
			const newTotalPay = name === 'payPerHour' 
				? (calculateHoursInRange(editedGigDetails.time) * Number(value)).toString()
				: prevState.totalPay;

			return {
				...prevState,
				[name]: value,
				...(name === 'payPerHour' ? { 
					totalPay: newTotalPay,
					summary: updateSummary(newTotalPay)
				} : {})
			};
		});
	};

	const handleTimeChange = (type: 'start' | 'end', value: string) => {
		const currentRange = parseTimeRange(editedGigDetails.time || '');
		let newStartTime = currentRange.startTime;
		let newEndTime = currentRange.endTime;

		if (type === 'start') {
			newStartTime = convertTo12Hour(value);
		} else {
			newEndTime = convertTo12Hour(value);
		}

		if (newStartTime && newEndTime) {
			const newTimeRange = `${newStartTime} - ${newEndTime}`;
			const newTotalPay = (calculateHoursInRange(newTimeRange) * Number(editedGigDetails.payPerHour)).toString();
			
			setEditedGigDetails((prevState) => ({
				...prevState,
				time: newTimeRange,
				totalPay: newTotalPay,
				summary: updateSummary(newTotalPay)
			}));
		}
	};

	return (
		<div className={styles.card}>
			<div className={styles.detailsHeader}>
				<h2 className={styles.detailsTitle}>
					{title}
				</h2>
				{!isEditingDetails ? (
					<Pencil className={styles.editPencilIcon} onClick={handleEditDetails} />
				) : (
					<X onClick={handleEditDetails} />
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
							value={editedGigDetails.location?.formatted_address || ''}
							onChange={handleInputChange}
							className={styles.textareaInput}
							disabled={lastRoleUsed === "GIG_WORKER"}
						/>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Date:</span>
						<input
							type="text"
							name="date"
							value={editedGigDetails.date}
							onChange={handleInputChange}
							className={styles.textareaInput}
							disabled={lastRoleUsed === "GIG_WORKER"}
						/>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Start Time:</span>
						<input
							type="time"
							value={convertTo24Hour(startTime)}
							onChange={(e) => handleTimeChange('start', e.target.value)}
							className={styles.textareaInput}
						/>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>End Time:</span>
						<input
							type="time"
							value={convertTo24Hour(endTime)}
							onChange={(e) => handleTimeChange('end', e.target.value)}
							className={styles.textareaInput}
						/>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Pay per hour:</span>
						<input
							type="text"
							name="payPerHour"
							value={editedGigDetails.payPerHour}
							onChange={handleInputChange}
							className={styles.textareaInput}
							disabled={lastRoleUsed === "GIG_WORKER"}
						/>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>{lastRoleUsed === "BUYER" ? "Total Cost:" : "Total Pay:"}</span>
						<input
							type="text"
							name="totalPay"
							value={editedGigDetails.totalPay}
							onChange={handleInputChange}
							className={styles.textareaInput}
							disabled={true}
						/>
					</div>
				</div>
			) : (
				/* Read-only View - NOW USING editedGigDetails */
				<div className={styles.detailsList}>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Location:</span>
						<span className={styles.detailItemValue}>
							{editedGigDetails.location?.formatted_address || ''}
						</span>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Date:</span>
						<span className={styles.detailItemValue}>
							{editedGigDetails.date}
						</span>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Time:</span>
						<span className={styles.detailItemValue}>
							{editedGigDetails.time}
						</span>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>Pay per hour:</span>
						<span className={styles.detailItemValue}>
							£{editedGigDetails.payPerHour}
						</span>
					</div>
					<div className={styles.detailItem}>
						<span className={styles.detailItemLabel}>{lastRoleUsed === "BUYER" ? "Total Cost:" : "Total Pay:"}</span>
              <span className={styles.detailItemValue}>
                £{editedGigDetails.totalPay}
              </span>
					</div>
				</div>
			)}
			{!isEditingDetails && !isOnConfirm && (
				<p className={styles.detailsSummaryText}>
					{editedGigDetails.summary}
				</p>
			)}
		</div>
	)
}

export default AmendGig
