/* eslint-disable max-lines-per-function */
import { Calendar, Check, Info, MessageSquare } from 'lucide-react';
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
import { deleteGig } from '@/actions/gigs/delete-gig';
import { toast } from 'sonner';
import ScreenHeaderWithBack from '../layout/ScreenHeaderWithBack';
import GigStatusIndicator from '../shared/GigStatusIndicator';


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
	isAvailableOffer?: boolean; // Whether this gig is an available offer for workers
	isCheckingOffer?: boolean; // Whether we're checking if this is an offer
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
	if (status === 'PENDING') {
		if (lastRoleUsed === "GIG_WORKER") {
			return 'Accept Gig';
		} else {
			return 'Offer Sent-awaiting acceptance';
		}
	}
	else return 'Gig Accepted';
}

const GigDetailsComponent = ({ userId, role, gig, setGig, isAvailableOffer = false, isCheckingOffer = false }: GigDetailsProps) => {
	const router = useRouter();
	const [isActionLoading, setIsActionLoading] = useState(false);
	const { user } = useAuth();
	const lastRoleUsed = getLastRoleUsed() as string;
	const [isWaitingHoldPayment, setIsWaitingHoldPayment] = useState(false);

	const gigDuration = calculateDuration(gig.startTime, gig.endTime);
	const buyer = gig.buyerName.split(" ")[0];
	const amendId = "123";

	const getButtonLabel = (action: string) => {
		const status = gig.status;

		switch (action) {
			case 'accept':
				if (status === 'PENDING') {
					return lastRoleUsed === "GIG_WORKER"
					? 'Accept Gig'
					: 'Offer Sent - awaiting acceptance';
				}
				return 'Gig Accepted';

			case 'start':
				if (status === 'PENDING' || status === 'ACCEPTED') {
					return lastRoleUsed === "GIG_WORKER"
						? 'Mark as you started the gig'
						: 'Mark as started';
				} 
				return lastRoleUsed === 'GIG_WORKER'
					? 'Gig Started'
					: `${workerName} has started the gig`;
			case 'complete':
				if (status === 'PENDING' || status === 'ACCEPTED' || status === 'IN_PROGRESS') {
					return lastRoleUsed === 'GIG_WORKER' ? 'Mark as complete' : `Mark as complete, pay ${workerName}`;
				} else {
					// If the gig is completed, show the appropriate message
					if (gig.isWorkerSubmittedFeedback && !gig.isBuyerSubmittedFeedback) {
						return lastRoleUsed === "GIG_WORKER" ? 'Gig Completed' : `🕒Confirm, pay and review ${workerName}`;
					} else if (gig.isBuyerSubmittedFeedback && !gig.isWorkerSubmittedFeedback) {
						return lastRoleUsed === "GIG_WORKER" ? 'Buyer confirmed & paid: leave feedback' : `${workerName} has completed the gig`;
					} else {
						return lastRoleUsed === "GIG_WORKER" ? 'Gig Completed' : `${workerName} has completed the gig`;
					}
				}
			case 'awaiting':
				if (lastRoleUsed === "GIG_WORKER") {
					return !gig.isBuyerSubmittedFeedback 
					? `Waiting for ${buyer} to confirm and pay` 
					: (
						<span className={styles.awaitingText}>
							<Check color="#000000" /> {buyer} Paid £{gig.estimatedEarnings}
						</span>
					);
				}
				return gig.isBuyerSubmittedFeedback 
					? (
						<span className={styles.awaitingText}>
							<Check color="#000000" /> Paid £{gig.estimatedEarnings}
						</span>
					)
					: 'Pay';
			default:
				return '';
		}
	};

	const handleGigAction = async (action: 'accept' | 'start' | 'complete' | 'requestAmendment' | 'reportIssue' | 'awaiting' | 'confirmed' | 'requested' | 'delete') => {
        if (!gig) return;
        setIsActionLoading(true);
        console.log(`Performing action: ${action} for gig: ${gig.id}`);
        // TODO: API call to backend, e.g., POST /api/gigs/worker/${gig.id}/action
        // Body: { action: 'start' } or { action: 'complete', details: {...} }
        try {
			await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
			// On success, update gig state locally or refetch
			if (action === 'accept' && gig && lastRoleUsed === 'GIG_WORKER') {
				setGig({ ...gig, status: 'ACCEPTED' });
				await updateGigOfferStatus({ gigId: gig.id, userId: userId, role: role, action: 'accept' });
			}
			else if (action === 'start' && gig) {
				setGig({ ...gig, status: 'IN_PROGRESS' });
				await updateGigOfferStatus({ gigId: gig.id, userId: userId, role: role, action: 'start' });
			} else if (action === 'complete' && gig) {
				setGig({ ...gig, status: 'COMPLETED'});
				await updateGigOfferStatus({ gigId: gig.id, userId: userId, role: role, action: 'complete' });
				// redirect to feedback page 
				if (lastRoleUsed === "GIG_WORKER") {
					router.push(`/user/${user?.uid}/worker/gigs/${gig.id}/feedback`);
				} else {
					router.push(`/user/${user?.uid}/buyer/gigs/${gig.id}/feedback`);
				}
			} else if (action === 'confirmed') {
				setGig({ ...gig, status: 'CONFIRMED' });
				// Show success message
			} else if (action === 'requestAmendment') {
				setGig({ ...gig, status: 'REQUESTED_AMENDMENT' });
				router.push(`/gigs/${gig.id}/amends/${amendId}`);
				// Show success message
			}
			else if (action === 'delete') {
				if (!user?.uid) {
					toast.error('User not authenticated');
					return;
				}

				const result = await deleteGig({ gigId: gig.id, userId: user.uid });
				
				if (result.error) {
					toast.error(result.error);
				} else {
					toast.success('Gig deleted successfully');
					// Redirect to buyer home page
					router.push(`/user/${user.uid}/buyer`);
				}
			}
		} catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Failed to ${action} gig:`, err.message);
            } else {
                console.error(`An unknown error occurred during action '${action}':`, err);
            }
        } finally {
            setIsActionLoading(false);
        }
    };

	return (
		<div className={styles.container}>
			<ScreenHeaderWithBack title={`${gig.role} Gig`} onBackClick={() => router.back()} />

			{/* Core Gig Info Section - Adapted to new structure */}
			<main className={styles.gigDetailsMain}>
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
				{(gig.status === 'PENDING' || gig.status === 'IN_PROGRESS' || gig.status === 'ACCEPTED') && (
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
						label={getButtonLabel('accept')}
						handleGigAction={() => handleGigAction('accept')}
						isActive={gig.status === 'PENDING'}
						isDisabled={lastRoleUsed === "BUYER" || gig.status !== 'PENDING'}
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
						isActive={
							(
								gig.status === 'IN_PROGRESS' || 
								gig.status === 'COMPLETED' || 
								gig.status === 'CONFIRMED' || 
								gig.status === 'AWAITING_BUYER_CONFIRMATION'
							) && (
								(lastRoleUsed === "GIG_WORKER" && !gig.isWorkerSubmittedFeedback) ||
								(lastRoleUsed === "BUYER" && !gig.isBuyerSubmittedFeedback)
							)
						}
						isDisabled={
							(lastRoleUsed === "GIG_WORKER" && gig.isWorkerSubmittedFeedback) ||
							(lastRoleUsed === "BUYER" && gig.isBuyerSubmittedFeedback)
						}
					/>

					{/* 4. Awaiting Buyer Confirmation */}

					<GigStatusIndicator
						label={getButtonLabel('awaiting')}
						isActive={
							(lastRoleUsed === "GIG_WORKER" && gig.isWorkerSubmittedFeedback) ||
							(lastRoleUsed === "BUYER" && gig.isBuyerSubmittedFeedback)
						}
						isDisabled={true}
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
			</main>
		</div>
	)
}

export default GigDetailsComponent;
