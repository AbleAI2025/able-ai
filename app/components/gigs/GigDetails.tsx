import { Calendar, Info, MessageSquare } from 'lucide-react';
import Logo from '../brand/Logo';
import styles from './GigDetails.module.css';
import { useRouter } from 'next/navigation';
import GigActionButton from '../shared/GigActionButton';
import Link from 'next/link';
import { useState } from 'react';
import type GigDetails from '@/app/types/GigDetailsTypes';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getLastRoleUsed } from '@/lib/last-role-used';
import { updateGigOfferStatus } from '@/actions/gigs/update-gig-offer-status';
import { holdGigFunds } from '@/app/actions/stripe/create-hold-gig-Funds';
import { toast } from 'sonner';


const formatGigDate = (isoDate: string) => new Date(isoDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const formatGigTime = (isoTime: string) => new Date(isoTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
const calculateDuration = (startIso: string, endIso: string): string => {
	const startDate = new Date(startIso);
	const endDate = new Date(endIso);
	const diffMs = endDate.getTime() - startDate.getTime();
	if (diffMs <= 0) return "N/A";
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
	let durationStr = "";
	if (hours > 0) durationStr += `${hours} hour${hours > 1 ? 's' : ''}`;
	if (minutes > 0) durationStr += ` ${minutes} minute${minutes > 1 ? 's' : ''}`;
	return durationStr.trim() || "N/A";
};

interface GigDetailsProps {
	userId: string;
	role: 'buyer' | 'worker';
	gig: GigDetails;
	setGig: (gig: GigDetails) => void; // Function to update gig state
}

const worker = {
	name: "Benji Asamoah",
	avatarUrl: "/images/benji.jpeg",
	gigs: 15,
	experience: 3,
	isStar: true,
};

const workerName = worker.name.split(" ")[0];

function getGigAcceptActionText(gig: GigDetails, lastRoleUsed: string): string {
	const status = gig.status;
	const internalStatus = gig.statusInternal;

	if (internalStatus === 'PENDING_WORKER_ACCEPTANCE') {
		if (lastRoleUsed === "GIG_WORKER") {
			return 'Waiting for rate acceptance';
		} else {
			return 'Agree to Rate - Accept and Hold Payment';
		}
	}
	else if (status === 'PENDING') {
		if (lastRoleUsed === "GIG_WORKER") {
			return 'Accept Gig';
		} else {
			return 'Offer Sent-awaiting acceptance';
		}
	}
	else return 'Gig Accepted';
}

const GigDetailsComponent = ({ userId, role, gig, setGig }: GigDetailsProps) => {
	const router = useRouter();
	const [isActionLoading, setIsActionLoading] = useState(false);
	const { user } = useAuth();
	const lastRoleUsed = getLastRoleUsed() as string;
	const [isWaitingHoldPayment, setIsWaitingHoldPayment] = useState(false);

	const gigDuration = calculateDuration(gig.startTime, gig.endTime);

	const getButtonLabel = (action: string) => {
		const status = gig.status;

		switch (action) {
			case 'accept':
				return getGigAcceptActionText(gig, lastRoleUsed);
			case 'start':
				return status === 'PENDING' || status === 'ACCEPTED' ? (lastRoleUsed === "GIG_WORKER" ? 'Mark as you started the gig' : 'Mark as started') : (lastRoleUsed === "GIG_WORKER" ? 'Gig Started' : `${workerName} has started the gig`);
			case 'complete':
				if (!gig.isWorkerSubmittedFeedback && !gig.isBuyerSubmittedFeedback) {
					if (lastRoleUsed === "GIG_WORKER") {
						return status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' ? 'Mark as complete' : 'Gig Completed';
					} else {
						return status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' ? `Mark as complete, pay ${workerName}` : `${workerName} has completed the gig`;
					}
				}
				else if (gig.isBuyerSubmittedFeedback && lastRoleUsed === "GIG_WORKER") {
					return status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' ? 'Buyer confirmed & paid: leave feedback' : 'Gig Completed';
				}
				else if (gig.isWorkerSubmittedFeedback && lastRoleUsed === "GIG_WORKER") {
					return status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' ? `🕒Confirm, pay and review ${workerName}` : 'Gig Completed';
				}

			case 'awaiting':
				if (lastRoleUsed === "GIG_WORKER") {
					return status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED' ? 'Request payment' : 'Payment requested';
				}
				return status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED' ? 'Pay' : 'Payment done';
			case 'requested':
				return 'Payment requested';
			case 'confirmed':
				return 'Payment done';
			default:
				return '';
		}
	};

	const handleGigAction = async (action: 'accept' | 'start' | 'complete' | 'requestAmendment' | 'reportIssue' | 'awaiting' | 'confirmed' | 'requested') => {
		if (!gig) return;
		setIsActionLoading(true);
		console.log(`Performing action: ${action} for gig: ${gig.id}`);

		try {
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
			// On success, update gig state locally or refetch
			if (action === 'accept' && gig) {
				if (gig.statusInternal === 'PAYMENT_HELD_PENDING_ACCEPTANCE' && lastRoleUsed === 'GIG_WORKER') {
					await updateGigOfferStatus({ gigId: gig.id, userId, role, action });
					setGig({ ...gig, status: 'ACCEPTED' });
				}

				if (gig.statusInternal === 'PENDING_WORKER_ACCEPTANCE' && lastRoleUsed === 'BUYER') {
					setIsWaitingHoldPayment(true);

					const resp = await holdGigFunds({
						gigId: gig.id,
						firebaseUid: userId,
						serviceAmountInCents: gig.estimatedEarnings * 100,
						currency: 'usd'
					});

					if (resp.error) throw new Error('Error trying to hold payment');

					setGig({ ...gig, status: 'PENDING', statusInternal: 'PAYMENT_HELD_PENDING_ACCEPTANCE' });
					toast.success('successful payment hold');
				}
			}
			else if (action === 'start' && gig) {
				setGig({ ...gig, status: 'IN_PROGRESS' });
				// Show success message
			} else if (action === 'complete' && gig) {
				setGig({ ...gig, status: 'COMPLETED' });
				if (lastRoleUsed === "GIG_WORKER") {
					// Redirect to feedback page if worker
					router.push(`/user/${user?.uid}/worker/gigs/${gig.id}/feedback`);
				} else {
					// Redirect to payment page if buyer
					router.push(`/user/${user?.uid}/buyer/gigs/${gig.id}/feedback`);
				}

			}
			else if (action === 'awaiting') {
				if (lastRoleUsed === "GIG_WORKER") {
					setGig({ ...gig, status: 'REQUESTED' });
					// Show success message
				}
			}
			else if (action === 'confirmed') {
				setGig({ ...gig, status: 'CONFIRMED' });
				// Show success message
			}
			// Handle other actions
		} catch (err: unknown) {
			if (err instanceof Error) {
				console.error(err.message || `Failed to ${action} gig.`);
				if (action === 'accept' && gig.statusInternal === 'PENDING_WORKER_ACCEPTANCE' && lastRoleUsed === 'BUYER')
					toast.error('Error in payment hold');
			} else {
				console.error(`Unknown error performing action ${action} on gig:`, err);
			}
		} finally {
			setIsWaitingHoldPayment(false);
			setIsActionLoading(false);
		}
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				{/* <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
                <ArrowLeft size={24} />
                </button> */}
				<Logo width={70} height={70} />
				<h1 className={styles.pageTitle}>{gig.role} Gig</h1>
				{/* <span className={`${styles.statusBadge} ${getStatusBadgeClass(gig.status)}`}>{gig.status.replace('_', ' ')}</span> */}
				<button onClick={() => router.push(`/chat?gigId=${gig.id}`)} className={styles.chatButton}>
					<MessageSquare size={40} fill="#ffffff" className={styles.icon} />
				</button>
			</header>

			{/* Core Gig Info Section - Adapted to new structure */}
			<section className={styles.gigDetailsSection}>
				<div className={styles.gigDetailsHeader}>
					<h2 className={styles.sectionTitle}>Gig Details</h2>
					<Calendar size={26} color='#ffffff' />
				</div>

				{/* <div className={styles.gigDetailsRow}>
                    <span className={styles.label}>Buyer:</span>
                    <span className={styles.detailValue}>{gig.buyerName}</span>
                </div> */}
				<div className={styles.gigDetailsRow}>
					<span className={styles.label}>Location:</span>
					<span className={styles.detailValue}>
						{gig.location}
						<a href={`https://maps.google.com/?q=${encodeURIComponent(gig.location)}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem' }}>(View Map)</a>
					</span>
				</div>
				<div className={styles.gigDetailsRow}>
					<span className={styles.label}>Date:</span>
					<span className={styles.detailValue}>{formatGigDate(gig.date)}</span>
				</div>
				<div className={styles.gigDetailsRow}>
					<span className={styles.label}>Time:</span>
					<span className={styles.detailValue}>{formatGigTime(gig.startTime)} - {formatGigTime(gig.endTime)} ({gigDuration})</span>
				</div>
				<div className={styles.gigDetailsRow}>
					<span className={styles.label}>Pay per hour:</span>
					<span className={styles.detailValue}>£{gig.hourlyRate.toFixed(2)}/hr</span>
				</div>
				<div className={styles.gigDetailsRow}>
					<span className={styles.label}>Total pay:</span>
					<span className={styles.detailValue}>£{gig.estimatedEarnings.toFixed(2)} + tips</span>
				</div>
				{/* Hiring Manager Info - Placeholder as it's not in current GigDetails interface */}

				{lastRoleUsed === "GIG_WORKER" && (
					<div className={styles.gigDetailsRow}>
						<span className={styles.label}>Hiring manager:</span>
						<span className={styles.detailValue}>{gig.hiringManager} <br /> {gig.hiringManagerUsername}</span>
					</div>
				)}

			</section>

			{lastRoleUsed === "GIG_WORKER" && (
				<section
					className={`${styles.gigDetailsSection} ${styles.workerSection}`}
				>
					<Image
						src={worker.avatarUrl}
						className={styles.workerAvatar}
						alt={worker.name}
						width={56}
						height={56}
					/>
					<div className={styles.workerDetailsContainer}>
						<div className={styles.workerDetails}>
							<span className={styles.workerName}>
								{worker.name}
							</span>
							{worker.gigs} Able gigs, {worker.experience} years experience
						</div>
						{worker.isStar && <Image src="/images/star.svg" alt="Star" width={56} height={50} />}
					</div>
				</section>
			)}

			{/* Negotiation Button - Kept from new structure */}
			{/* Added a check to only show if gig is accepted */}
			{(lastRoleUsed === "GIG_WORKER" && (gig.status === 'PENDING' || gig.status === 'IN_PROGRESS' || gig.status === 'ACCEPTED')) && (
				<button className={styles.negotiationButton} onClick={() => handleGigAction('requestAmendment')}>
					Negotiate, cancel or change gig details
				</button>
			)}

			{/* Special Instructions Section */}
			{gig.specialInstructions && (
				<section className={styles.instructionsSection}>
					<h2 className={styles.specialInstTitle}><Info size={18} />Special Instructions</h2>
					<p className={styles.specialInstructions}>{gig.specialInstructions}</p>
				</section>
			)}

			{/* Primary Actions Section - Adapted to new structure */}
			<section className={styles.actionSection}>
				<GigActionButton
					label={!isWaitingHoldPayment ? getButtonLabel('accept') : 'processing...'}
					handleGigAction={() => handleGigAction('accept')}
					isActive={!isWaitingHoldPayment && gig.status === 'PENDING'}
					isDisabled={gig.status !== 'PENDING'}
				/>

				{/* 2. Start Gig */}
				<GigActionButton
					label={getButtonLabel('start')}
					handleGigAction={() => handleGigAction('start')}
					isActive={gig.status === 'ACCEPTED'}
					isDisabled={gig.status !== 'ACCEPTED'}
				/>

				{/* 3. Complete Gig */}
				<GigActionButton
					label={getButtonLabel('complete')}
					handleGigAction={() => handleGigAction('complete')}
					isActive={gig.status === 'IN_PROGRESS'}
					isDisabled={gig.status !== 'IN_PROGRESS'}
				/>

				{/* 4. Awaiting Buyer Confirmation */}
				<GigActionButton
					label={getButtonLabel('awaiting')}
					handleGigAction={() => handleGigAction('awaiting')}
					isActive={gig.status === 'COMPLETED'}
					isDisabled={gig.status !== 'COMPLETED'}
				/>

				{/* Info messages for other statuses
                {gig.status === 'AWAITING_BUYER_CONFIRMATION' && (
                <p className={styles.actionInfoText}>Waiting for buyer to confirm completion.</p>
                )}
                {gig.status === 'CANCELLED' && (
                <p className={styles.actionInfoText} style={{color: 'var(--error-color)', backgroundColor: 'rgba(239,68,68,0.1)'}}>
                <XCircle size={18} style={{marginRight: '8px'}}/> This gig was cancelled.
                </p>
                )}
                {gig.status === 'COMPLETED' && (
                <p className={styles.actionInfoText} style={{color: 'var(--success-color)'}}>
                <CheckCircle size={18} style={{marginRight: '8px'}}/> Gig completed successfully!
                </p>
                )} */}
			</section>

			{/* Secondary Actions Section - Adapted to new structure */}

			{lastRoleUsed === "GIG_WORKER" && (
				<button className={styles.negotiationButton} disabled>
					Cancel, amend gig timing or add tips
				</button>
			)}
			<section className={`${styles.secondaryActionsSection}`}> {/* Using secondaryActionsSection class */}
				<Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className={styles.secondaryActionButton}>
					Terms of agreement
				</Link>
				<button onClick={() => handleGigAction('reportIssue')} className={styles.secondaryActionButton} disabled={isActionLoading}>
					Report an Issue
				</button>
				{/* <button onClick={() => handleGigAction('delegate')} className={styles.secondaryActionButton} disabled={isActionLoading}>
                        <Share2 size={16} style={{marginRight: '8px'}}/> Delegate Gig
                    </button> */}
			</section>



			{/* Footer (Home Button) */}
			{/* <footer className={styles.footer}>
                <Link href={`/user/${user?.uid}/worker`} passHref>
                <button className={styles.homeButton} aria-label="Go to Home">
                    <Home size={24} />
                </button>
                </Link>
            </footer> */}
		</div>
	)
}

export default GigDetailsComponent;
