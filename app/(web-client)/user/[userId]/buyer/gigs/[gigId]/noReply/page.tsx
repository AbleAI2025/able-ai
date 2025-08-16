'use client'
import Logo from '@/app/components/brand/Logo'
import styles from './NoReply.module.css'
import RehireWorkerCard from '@/app/components/buyer/RehireWorkerCard';
import { useParams, useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';

interface Data {
    originalGig: {
        workerName: string;
        role: string;
        originalDate: string;
        originalLocation: string;
        startTime: string;
        endTime: string;
    };
    workerData: {
        workerId: string;
        name: string;
        avatarUrl?: string;
        role: string;
        ableGigs: number;
        experienceYears: string | number;
        reviewKeywords: string[];
        proposedHourlyRate: number;
        proposedHours: number;
        platformFeePercent: number;
        paymentProviderFeeFixed: number;
        paymentProviderFeePercent: number;
    };
}

const NoReplyOnOffer = () => {

    const [data, setData] = useState<Data>({
        originalGig: {
            workerName: '',
            role: '',
            originalDate: '',
            originalLocation: '',
            startTime: '',
            endTime: '',
        },
        workerData: {
            workerId: '',
            name: '',
            avatarUrl: '',
            role: '',
            ableGigs: 0,
            experienceYears: '',
            reviewKeywords: [],
            proposedHourlyRate: 0,
            proposedHours: 0,
            platformFeePercent: 0,
            paymentProviderFeeFixed: 0,
            paymentProviderFeePercent: 0,
        }
    });

const suggestedWorkers = [
    {
        workerId: "benji-jones-id",
        name: "Benji Jones",
        avatarUrl: "/images/benji.jpeg",
        role: "Bartender",
        ableGigs: 15,
        experienceYears: "3+",
        reviewKeywords: ["lively", "professional", "hardworking"],
        proposedHourlyRate: 15,
        proposedHours: 4,
        platformFeePercent: 6.5,
        paymentProviderFeeFixed: 0.2,
        paymentProviderFeePercent: 1.5,
    },
    {
        workerId: "jessica-smith-id",
        name: "Jessica Smith",
        avatarUrl: "/images/jessica.jpeg",
        role: "Bartender",
        ableGigs: 10,
        experienceYears: "2+",
        reviewKeywords: ["friendly", "efficient", "reliable"],
        proposedHourlyRate: 18,
        proposedHours: 5,
        platformFeePercent: 6.5,
        paymentProviderFeeFixed: 0.2,
        paymentProviderFeePercent: 1.5,
    },
];

  const { userId, gigId } = useParams();
  const router = useRouter();

useEffect(() => {
    const fetchData = async (buyerUserId: string, gigId: string) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        return {
            originalGig: {
                workerName: "Jerimiah Jones",
                role: "Bartender",
                originalDate: "Tuesday 12th September",
                originalLocation: "Central Station",
                startTime: "6 pm",
                endTime: "10 pm",
            },
            workerData: {
                workerId: "jerimiah-jones-id",
                name: "Jerimiah Jones",
                avatarUrl: "/images/jessica.jpeg",
                role: "Bartender",
                ableGigs: 15,
                experienceYears: "3+",
                reviewKeywords: ["lively", "professional", "hardworking"],
                proposedHourlyRate: 15,
                proposedHours: 4,
                platformFeePercent: 6.5,
                paymentProviderFeeFixed: 0.2,
                paymentProviderFeePercent: 1.5,
            },
        };
    };


    (async () => {
        const data = await fetchData(userId as string, gigId as string);
        setData(data);
    })();

  }, [userId, gigId]);
//   const data = fetchData(params.userId, params.gigId);

  const handleBookWorker = (workerId: string) => {
    console.log(`Booking worker with ID: ${workerId}`);
  };

  return (
    <div className={styles.container}>
        <ScreenHeaderWithBack onBackClick={() => router.back()} />
        <main className={styles.mainContent}>
            <p className={styles.originalGigInfo}>
                {data.originalGig.workerName.split(" ")[0]} didn&apos;t reply to your {data.originalGig.role.toLowerCase()} gig offer. 
                Here are some other available workers for your {data.originalGig.startTime} shift at the {data.originalGig.originalLocation} on {data.originalGig.originalDate}.
            </p>
            <div className={styles.suggestedWorkers}>
                {suggestedWorkers.map((worker) => (
                    <RehireWorkerCard key={worker.workerId} workerData={worker} isBooking={false} onBook={handleBookWorker} />
                ))}
            </div>
        </main>
        <footer className={styles.footerNav}>
            <Link href={`/user/${userId}/buyer`} passHref>
                <button className={styles.homeButtonNav} aria-label="Go to Home">
                    <Image src="/images/home.svg" width={40} height={40} alt="home" />
                </button>
            </Link>
        </footer>
    </div>
  )
}

export default NoReplyOnOffer
