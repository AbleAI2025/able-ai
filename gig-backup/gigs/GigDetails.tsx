/* eslint-disable max-lines-per-function */
import { Calendar, Check, Info, MessageSquare, Clock, XCircle, ChevronLeft } from 'lucide-react';
import Logo from '../brand/Logo';
import styles from './GigDetails.module.css';
import { useRouter } from 'next/navigation';
import GigActionButton from '../GigActionButton';
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
import { acceptGigOffer } from '@/actions/gigs/accept-gig-offer';
import { declineGigOffer } from '@/actions/gigs/decline-gig-offer';


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
	const lastRoleUsed = getLastRoleUsed();
	const [isWaitingHoldPayment, setIsWaitingHoldPayment] = useState(false);
	const [isNegotiating, setIsNegotiating] = useState(false);
	const [isReportingIssue, setIsReportingIssue] = useState(false);
	const [isDelegating, setIsDelegating] = useState(false);
	const [isLoadingTerms, setIsLoadingTerms] = useState(false);

	const gigDuration = calculateDuration(gig.startTime, gig.endTime);
	const buyer = gig.buyerName.split(" ")[0];
	const amendId = "123";

	// Get worker name from gig data if available, otherwise use a placeholder
	const getWorkerName = () => {
		// If this is a worker viewing their own gig, use their name
		if (lastRoleUsed === "GIG_WORKER" && role === 'worker') {
			return user?.displayName?.split(" ")[0] || "Worker";
		}
		// If there's a worker assigned to the gig, use their name
		if (gig.workerName) {
			return gig.workerName.split(" ")[0];
		}
		// Fallback for when no worker is assigned yet
		return "Worker";
	};

	const workerName = getWorkerName();

	// Get worker stats with fallbacks
	const getWorkerStats = () => {
		return {
			gigs: gig.workerGigs || 0,
			experience: gig.workerExperience || 0,
			isStar: gig.isWorkerStar || false
		};
	};

	const workerStats = getWorkerStats();

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
						? 'Mark you have started your shift'
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

	const handleGigAction = async (action: 'accept' | 'start' | 'complete' | 'requestAmendment' | 'reportIssue' | 'awaiting' | 'confirmed' | 'requested' | 'delete' | 'decline' | 'paid') => {
        if (!gig) return;
        setIsActionLoading(true);
        console.log(`Performing action: ${action} for gig: ${gig.id}`);
        
        try {
			// Handle gig offer acceptance/decline for workers
			if (action === 'accept' && lastRoleUsed === 'GIG_WORKER' && gig.statusInternal === 'PENDING_WORKER_ACCEPTANCE') {
				const result = await acceptGigOffer({ gigId: gig.id, userId: userId });
				if (result.error) {
					toast.error(result.error);
					return;
				}
				setGig({ ...gig, status: 'ACCEPTED', statusInternal: 'ACCEPTED' });
				toast.success('Gig offer accepted successfully! You can now start the gig when ready.');
				
				// Optionally redirect to worker home or refresh the page after a short delay
				setTimeout(() => {
					router.push(`/user/${user?.uid}/worker`);
				}, 2000);
				return;
			}
			if (action === 'decline' && lastRoleUsed === 'GIG_WORKER' && gig.statusInternal === 'PENDING_WORKER_ACCEPTANCE') {
				const result = await declineGigOffer({ gigId: gig.id, userId: userId });
				if (result.error) {
					toast.error(result.error);
					return;
				}
				setGig({ ...gig, status: 'CANCELLED', statusInternal: 'DECLINED_BY_WORKER' });
				toast.success('Gig offer declined successfully!');
				
				// Redirect back to offers page after declining
				setTimeout(() => {
					router.push(`/user/${user?.uid}/worker/offers`);
				}, 1500);
				return;
			}

			// Handle other actions
			if (action === 'accept' && gig && lastRoleUsed === 'GIG_WORKER') {
				setGig({ ...gig, status: 'ACCEPTED' });
				await updateGigOfferStatus({ gigId: gig.id, userId: userId, role: role, action: 'accept' });
				toast.success('Gig accepted successfully!');
			}
			else if (action === 'start' && gig) {
				setGig({ ...gig, status: 'IN_PROGRESS' });
				await updateGigOfferStatus({ gigId: gig.id, userId: userId, role: role, action: 'start' });
				toast.success('Gig started successfully!');
			} else if (action === 'complete' && gig) {
				setGig({ ...gig, status: 'COMPLETED'});
				await updateGigOfferStatus({ gigId: gig.id, userId: userId, role: role, action: 'complete' });
				toast.success('Gig completed successfully!');
				// redirect to feedback page 
				if (lastRoleUsed === "GIG_WORKER") {
					router.push(`/user/${user?.uid}/worker/gigs/${gig.id}/feedback`);
				} else {
					router.push(`/user/${user?.uid}/buyer/gigs/${gig.id}/feedback`);
				}
			} else if (action === 'confirmed') {
				setGig({ ...gig, status: 'CONFIRMED' });
				toast.success('Gig confirmed successfully!');
			} else if (action === 'requestAmendment') {
				setGig({ ...gig, status: 'REQUESTED_AMENDMENT' });
				router.push(`/gigs/${gig.id}/amends/${amendId}/request`);
			} else if (action === 'reportIssue') {
				router.push(`/gigs/${gig.id}/report-issue`);
			} else if (action === 'delete') {
				await deleteGig({ gigId: gig.id, userId: userId });
				toast.success('Gig deleted successfully!');
				router.push(`/user/${user?.uid}/buyer`);
			} else if (action === 'paid') {
				// Handle payment confirmation
				toast.success('Payment confirmed!');
				// You can add payment confirmation logic here
			}
        } catch (error) {
            console.error('Error performing gig action:', error);
            toast.error('Failed to perform action. Please try again.');
        } finally {
            setIsActionLoading(false);
        }
    };

	// Handler for negotiating gig details
	const handleNegotiateGig = () => {
		if (!user?.uid || !gig.id) return;
		
		// Navigate to the existing negotiation page
		router.push(`/gigs/${gig.id}/amends/${amendId}`);
	};

	// Handler for reporting an issue
	const handleReportIssue = () => {
		if (!user?.uid || !gig.id) return;
		
		// Navigate to the existing report issue page
		router.push(`/gigs/${gig.id}/report-issue`);
	};

	// Handler for delegating gig
	const handleDelegateGig = () => {
		if (!user?.uid || !gig.id) return;
		
		// Navigate to the existing delegate gig page
		router.push(`/gigs/${gig.id}/delegate`);
	};

	// Handler for viewing terms of agreement
	const handleViewTerms = () => {
		// Navigate to the existing terms page
		router.push('/legal/terms');
	};

	// New UI design for workers based on the image
	if (lastRoleUsed === "GIG_WORKER" && role === 'worker') {
		return (
			<div className={styles.workerContainer}>
				{/* Header */}
				<header className={styles.workerHeader}>
					<div className={styles.headerLeft}>
						<button className={styles.backButton} onClick={() => router.back()}>
							<ChevronLeft size={20} color="#ffffff" />
						</button>
						<div className={styles.logoContainer}>
							<Logo width={50} height={50} />
						</div>
						<h1 className={styles.workerPageTitle}>{gig.role} Gig</h1>
					</div>
					<button className={styles.workerChatButton}>
						<MessageSquare size={30} color="#ffffff" />
					</button>
				</header>

				<main className={styles.workerMain}>
					{/* Gig Details Section */}
					<section className={styles.workerGigDetailsSection}>
						<div className={styles.workerGigDetailsHeader}>
							<h2 className={styles.workerSectionTitle}>Gig Details</h2>
							<Calendar size={20} color="#ffffff" />
						</div>

						<div className={styles.workerGigDetailsRow}>
							<span className={styles.workerLabel}>Location:</span>
							<span className={styles.workerDetailValue}>{gig.location}</span>
						</div>
						<div className={styles.workerGigDetailsRow}>
							<span className={styles.workerLabel}>Date:</span>
							<span className={styles.workerDetailValue}>{formatGigDate(gig.date)}</span>
						</div>
						<div className={styles.workerGigDetailsRow}>
							<span className={styles.workerLabel}>Time:</span>
							<span className={styles.workerDetailValue}>{formatGigTime(gig.startTime)} - {formatGigTime(gig.endTime)}</span>
						</div>
						<div className={styles.workerGigDetailsRow}>
							<span className={styles.workerLabel}>Pay per hour:</span>
							<span className={styles.workerDetailValue}>£{gig.hourlyRate.toFixed(2)}</span>
						</div>
						<div className={styles.workerGigDetailsRow}>
							<span className={styles.workerLabel}>Total Pay:</span>
							<span className={styles.workerDetailValue}>£{gig.estimatedEarnings.toFixed(2)}</span>
						</div>
						<div className={styles.workerGigDetailsRow}>
							<span className={styles.workerLabel}>Hiring manager:</span>
							<span className={styles.workerDetailValue}>{gig.buyerName} @{gig.buyerName.toLowerCase().replace(/\s+/g, '')}</span>
						</div>
					</section>

					{/* Negotiation Button */}
					<button 
						className={styles.workerNegotiationButton} 
						onClick={handleNegotiateGig}
						disabled={isNegotiating}
					>
						{isNegotiating ? 'Opening...' : 'Negotiate, cancel or change gig details'}
					</button>

					{/* Special Instructions Section */}
					{gig.specialInstructions && (
						<section className={styles.workerInstructionsSection}>
							<h2 className={styles.workerSpecialInstTitle}>Special Instructions</h2>
							<p className={styles.workerSpecialInstructions}>{gig.specialInstructions}</p>
						</section>
					)}

					{/* Workflow Buttons */}
					<section className={styles.workerWorkflowSection}>
						{/* Step 1: Accept Gig */}
						<button 
							className={`${styles.workerWorkflowButton} ${gig.status === 'PENDING' ? styles.workerWorkflowButtonActive : styles.workerWorkflowButtonInactive}`}
							onClick={() => gig.status === 'PENDING' && handleGigAction('accept')}
							disabled={gig.status !== 'PENDING' || isActionLoading}
						>
							<div className={styles.workerWorkflowStep}>1</div>
							<span>Accept gig</span>
						</button>

						{/* Step 2: Mark Started */}
						<button 
							className={`${styles.workerWorkflowButton} ${gig.status === 'ACCEPTED' ? styles.workerWorkflowButtonActive : styles.workerWorkflowButtonInactive}`}
							onClick={() => gig.status === 'ACCEPTED' && handleGigAction('start')}
							disabled={gig.status !== 'ACCEPTED' || isActionLoading}
						>
							<div className={styles.workerWorkflowStep}>2</div>
							<span>Mark you have started your shift</span>
						</button>

						{/* Step 3: Mark Complete */}
						<button 
							className={`${styles.workerWorkflowButton} ${gig.status === 'IN_PROGRESS' ? styles.workerWorkflowButtonActive : styles.workerWorkflowButtonInactive}`}
							onClick={() => gig.status === 'IN_PROGRESS' && handleGigAction('complete')}
							disabled={gig.status !== 'IN_PROGRESS' || isActionLoading}
						>
							<div className={styles.workerWorkflowStep}>3</div>
							<span>Mark as complete</span>
						</button>

						{/* Step 4: Paid */}
						<button 
							className={`${styles.workerWorkflowButton} ${gig.status === 'COMPLETED' ? styles.workerWorkflowButtonActive : styles.workerWorkflowButtonInactive}`}
							onClick={() => gig.status === 'COMPLETED' && handleGigAction('paid')}
							disabled={gig.status !== 'COMPLETED' || isActionLoading}
						>
							<div className={styles.workerWorkflowStep}>4</div>
							<span>Paid</span>
						</button>
					</section>

					{/* Additional Action Buttons */}
					<section className={styles.workerAdditionalActions}>
						<button 
							className={styles.workerAdditionalButton} 
							onClick={handleReportIssue}
							disabled={isReportingIssue}
						>
							{isReportingIssue ? 'Opening...' : 'Report an issue'}
						</button>
						<button 
							className={styles.workerAdditionalButton} 
							onClick={handleDelegateGig}
							disabled={isDelegating}
						>
							{isDelegating ? 'Opening...' : 'Delegate gig'}
						</button>
					</section>

					{/* Terms of Agreement Button */}
					<button 
						className={styles.workerTermsButton} 
						onClick={handleViewTerms}
						disabled={isLoadingTerms}
					>
						{isLoadingTerms ? 'Opening...' : 'Terms of Agreement'}
					</button>
				</main>
			</div>
		);
	}

	// Original UI for buyers
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
							src={gig.workerAvatarUrl || "/images/worker-placeholder.png"}
							className={styles.workerAvatar}
							alt={gig.workerName || "Worker"}
							width={56}
							height={56}
						/>
						<div className={styles.workerDetailsContainer}>
							<div className={styles.workerDetails}>
								<span className={styles.workerName}>
									{gig.workerName || "Worker"}
								</span>
								{workerStats.gigs} Able gigs, {workerStats.experience} years experience
							</div>
							{workerStats.isStar && <Image src="/images/star.svg" alt="Star" width={56} height={50} />}
						</div>
					</section>
				)}

				{/* Worker Information Section - Show when gig is accepted and worker is assigned */}
				{gig.status === 'ACCEPTED' && gig.workerName && (
					<section className={`${styles.gigDetailsSection} ${styles.workerInfoSection}`}>
						<div className={styles.sectionHeader}>
							<h3 className={styles.sectionTitle}>Assigned Worker</h3>
						</div>
						<div className={styles.workerInfoContainer}>
							<Image
								src={gig.workerAvatarUrl || "/images/worker-placeholder.png"}
								className={styles.workerAvatar}
								alt={gig.workerName}
								width={48}
								height={48}
							/>
							<div className={styles.workerInfoDetails}>
								<span className={styles.workerName}>{gig.workerName}</span>
								<span className={styles.workerStats}>
									{workerStats.gigs} Able gigs • {workerStats.experience} years experience
								</span>
								{workerStats.isStar && (
									<div className={styles.starBadge}>
										<Image src="/images/star.svg" alt="Star Worker" width={16} height={16} />
										<span>Star Worker</span>
									</div>
								)}
							</div>
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
				<section className={`${styles.actionSection}`}> {/* Using secondaryActionsSection class */}
					{/* Status Messages for different gig states */}
					{gig.status === 'ACCEPTED' && (
						<div className={styles.statusMessage}>
							<div className={styles.statusSuccess}>
								<Check size={20} color="#10b981" />
								<span>Gig Accepted Successfully!</span>
							</div>
							<p className={styles.statusDescription}>
								{lastRoleUsed === "GIG_WORKER" 
									? "You've accepted this gig. You can now start the gig when you're ready."
									: "A worker has accepted your gig offer. They can start the gig when ready."
								}
							</p>
						</div>
					)}

					{gig.status === 'IN_PROGRESS' && (
						<div className={styles.statusMessage}>
							<div className={styles.statusInProgress}>
								<Clock size={20} color="#f59e0b" />
								<span>Gig In Progress</span>
							</div>
							<p className={styles.statusDescription}>
								{lastRoleUsed === "GIG_WORKER" 
									? "You've started the gig. Complete it when finished."
									: "The worker has started the gig. They will mark it complete when finished."
								}
							</p>
						</div>
					)}

					{gig.status === 'COMPLETED' && (
						<div className={styles.statusMessage}>
							<div className={styles.statusCompleted}>
								<Check size={20} color="#10b981" />
								<span>Gig Completed</span>
							</div>
							<p className={styles.statusDescription}>
								{lastRoleUsed === "GIG_WORKER" 
									? "You've completed the gig. Waiting for buyer confirmation and payment."
									: "The worker has completed the gig. Please confirm and process payment."
								}
							</p>
						</div>
					)}

					{gig.status === 'CANCELLED' && (
						<div className={styles.statusMessage}>
							<div className={styles.statusCancelled}>
								<XCircle size={20} color="#ef4444" />
								<span>Gig Cancelled</span>
							</div>
							<p className={styles.statusDescription}>
								This gig has been cancelled and is no longer active.
							</p>
						</div>
					)}

					{/* Accept Button - Only show for pending gigs */}
					{gig.status === 'PENDING' && (
						<GigActionButton
							label={getButtonLabel('accept')}
							handleGigAction={() => handleGigAction('accept')}
							isActive={gig.status === 'PENDING'}
							isDisabled={lastRoleUsed !== "GIG_WORKER" || gig.status !== 'PENDING'}
						/>
					)}

					{/* Decline button for gig offers */}
					{lastRoleUsed === "GIG_WORKER" && gig.statusInternal === 'PENDING_WORKER_ACCEPTANCE' && (
						<GigActionButton
							label="Decline Offer"
							handleGigAction={() => handleGigAction('decline')}
							isActive={true}
							isDisabled={false}
						/>
					)}

					{/* Start Gig Button - Only show for accepted gigs */}
					{gig.status === 'ACCEPTED' && (
						<GigActionButton
							label={getButtonLabel('start')}
							handleGigAction={() => handleGigAction('start')}
							isActive={gig.status === 'ACCEPTED'}
							isDisabled={gig.status !== 'ACCEPTED'}
						/>
					)}

					{/* Complete Gig Button - Show for in-progress or completed gigs */}
					{(gig.status === 'IN_PROGRESS' || gig.status === 'COMPLETED') && (
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
					)}

					{/* Awaiting Buyer Confirmation Status */}
					<GigStatusIndicator
						label={getButtonLabel('awaiting')}
						isActive={
							(lastRoleUsed === "GIG_WORKER" && gig.isWorkerSubmittedFeedback) ||
							(lastRoleUsed === "BUYER" && gig.isBuyerSubmittedFeedback)
						}
						isDisabled={true}
					/>
				</section>

				{/* Secondary Actions Section - Adapted to new structure */}
				<section className={`${styles.secondaryActionsSection}`}> {/* Using secondaryActionsSection class */}
					<Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className={styles.secondaryActionButton}>
						Terms of agreement
					</Link>
					<button onClick={() => handleGigAction('reportIssue')} className={styles.secondaryActionButton} disabled={isActionLoading}>
						Report an Issue
					</button>
					
					{/* Worker-specific action buttons */}
					{lastRoleUsed === "GIG_WORKER" && role === 'worker' && (
						<>
							{/* Complete Gig Button - Navigate to complete page */}
							{(gig.status === 'IN_PROGRESS' || gig.status === 'COMPLETED') && (
								<Link href={`/user/${userId}/worker/gigs/${gig.id}/complete`} className={styles.secondaryActionButton}>
									Complete gig
								</Link>
							)}
							
							{/* Amend Gig Button - Navigate to amend page */}
							{(gig.status === 'ACCEPTED' || gig.status === 'IN_PROGRESS') && (
								<Link href={`/user/${userId}/worker/gigs/${gig.id}/amend`} className={styles.secondaryActionButton}>
									Amend gig
								</Link>
							)}
							
							{/* Mark Started Button */}
							{gig.status === 'ACCEPTED' && (
								<button onClick={() => handleGigAction('start')} className={styles.secondaryActionButton} disabled={isActionLoading}>
									Mark you have started your shift
								</button>
							)}
							
							{/* Mark Complete Button */}
							{gig.status === 'IN_PROGRESS' && (
								<button onClick={() => handleGigAction('complete')} className={styles.secondaryActionButton} disabled={isActionLoading}>
									Mark as complete
								</button>
							)}
							
							{/* Paid Button */}
							{gig.status === 'COMPLETED' && (
								<button onClick={() => handleGigAction('paid')} className={styles.secondaryActionButton} disabled={isActionLoading}>
									Paid
								</button>
							)}
						</>
					)}
					
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
