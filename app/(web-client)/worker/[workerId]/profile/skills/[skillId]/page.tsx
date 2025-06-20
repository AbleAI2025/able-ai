"use client";

import React from 'react';
import { useParams } from 'next/navigation';

import { 
    Trophy, Star,Martini,
} from 'lucide-react';
import styles from './SkillSpecificPage.module.css';
import SkillSplashScreen from '@/app/components/profile/SkillSplashScreen';
import CloseButton from '@/app/components/profile/CloseButton';
import HireButton from '@/app/components/profile/HireButton';

// --- INTERFACES (Copied from plan) ---

const skillProfile = {
  name: "Benji",
  title: "Bartender",
  hashtags: "#Licensedbarmanager #customerservice #timemanagement #mixology",
  customerReviewsText: "Professional, charming and lively",
  ableGigs: 15,
  experienceYears: 8,
  Eph: 15,
  statistics: {
    reviews: 13,
    paymentsCollected: '£4899',
    tipsReceived: '£767'
  },
  supportingImages: [
    "/images/bar-action.svg",
    "/images/bar-action.svg",
  ],
  badges: [
    { id: "a1", icon: Trophy, textLines: ["Mixology Master"] },
    { id: "a2", icon: Star, textLines: ["Customer Favourite"] },
    { id: "a3", icon: Martini, textLines: ["Creative Cocktails"] }
   
  ],
  qualifications: [
    "Bachelor’s Degree in Graphic Design",
    "Licensed bar manager",
    "Cocktail preparation diploma"
  ],
  buyerReviews: [
    {
      name: "Alex Johnson",
      date: "2023-10-15",
      text: "Amazing skills and great personality. The cocktails were fantastic!"
    },
    {
      name: "Maria Gomez",
      date: "2023-09-20",
      text: "Very professional and friendly. Made our event a success!"
    },
    {
      name: "Chris Lee",
      date: "2023-08-05",
      text: "Highly recommended! The drinks were as delightful as the service."
    }
  ],
  recommendation: {
    name: "Dave Smith",
    date: "2023-10-15",
    text: "Brilliant bartender, great to work with!"
  }
};
// --- MOCK FUNCTION (Adapted from worker profile page) ---
// async function fetchPublicSkillProfile(workerId: string, skillId: string): Promise<PublicSkillProfile | null> {
//     console.log(`Fetching public profile for worker: ${workerId}, skill: ${skillId}`);
//     await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

//     // --- MOCK DATA --- Use skillId to return different data if needed
//     if (workerId === "benji-asamoah-id" && skillId === "bartender-skill-id") {
//         return {
//             workerId: "benji-asamoah-id",
//             workerName: "Benji Asamoah",
//             workerProfileImageUrl: "/images/benji-profile-image.jpg", // Using the larger profile image
//             skillId: "bartender-skill-id",
//             skillName: "Bartender",
//             isFavoritedByCurrentUser: true,
//             skillHashtags: ["#licensedbarmanager", "#cocktailartist", "#mobilebar"],
//             skillRelatedReviewSummary: "Customer reviews: Professional, charming and lively",
//             skillAbleGigs: 15,
//             skillExperience: "3 years",
//             skillEph: 25,
//             skillPortfolio: [
//                 { id: "p1", type: 'image', thumbnailUrl: "/images/mock-portfolio-1.jpg", caption: "Mixing drinks" },
//                 { id: "p2", type: 'image', thumbnailUrl: "/images/mock-portfolio-2.jpg", caption: "Event setup" },
//                 // Add more mock portfolio items
//             ],
//             skillRelevantBadges: [
//                 { id: "b1", name: "Always on time", icon: AwardIconLucide },
//                 { id: "b2", name: "Able Professional", icon: Star }, // Using Star icon as example
//             ],
//             skillRelevantQualifications: [
//                 "Licensed bar manager",
//                 "Advanced Mixology Course Certificate",
//             ],
//             skillTotalReviews: 13,
//             skillReviews: [
//                 { id: "r1", reviewerName: "Alice B.", date: "2023-10-26", comment: "Benji was fantastic! Our guests loved his cocktails." },
//                 { id: "r2", reviewerName: "Charlie D.", date: "2023-11-15", comment: "Very professional and efficient." },
//             ],
//             skillRecommendations: [
//                 { id: "rec1", recommenderName: "David E.", date: "2023-09-01", comment: "Highly recommend Benji for any event." },
//             ],
//         };
//     }
//     // Return null for other IDs to simulate not found
//     return null;
// }

// --- COMPONENT ---
export default function PublicSkillProfilePage() {
  const params = useParams();
  const workerIdToView = params.workerId as string;

  // Use this if auth context is needed, e.g., for hire button logic

  // const [skillProfile, setSkillProfile] = useState<PublicSkillProfile | null>(null);
  // const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   if (workerIdToView && skillIdToView) {
  //     setIsLoadingProfile(true);
  //     fetchPublicSkillProfile(workerIdToView, skillIdToView)
  //       .then(data => {
  //         if (data) setSkillProfile(data);
  //         else setError("Skill profile not found.");
  //       })
  //       .catch(err => {
  //         console.error("Error loading skill profile:", err);
  //         setError("Could not load skill profile.");
  //       })
  //       .finally(() => setIsLoadingProfile(false));
  //   } else {
  //     setError("Worker ID or Skill ID missing.");
  //     setIsLoadingProfile(false);
  //   }
  // }, [workerIdToView, skillIdToView]);

  // const handleHireWorkerForSkill = () => {
  //   if (!skillProfile) return; // Add authUser check if needed later
  //   // TODO: Implement actual hiring flow for this specific skill
  //   alert(`Initiate hiring flow for ${skillProfile.name} for skill: ${skillProfile.title}`);
  //   // Example navigation:
  //   // router.push(`/user/${authUser.uid}/buyer/book-gig?workerId=${skillProfile.workerId}&skillId=${skillProfile.skillId}`);
  // };

  // // Optional: Handle favorite toggle if the component is interactive
  // const handleFavoriteToggle = () => {
  //     // TODO: Implement favorite/unfavorite logic via API
  //     console.log("Toggle favorite for skill:", skillProfile?.skillId);
  // };

  // if (isLoadingProfile) {
  //   return <div className={styles.pageLoadingContainer}><Loader2 className="animate-spin" size={48} /> Loading Skill Profile...</div>;
  // }
  // if (error) {
  //   return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  // }
  // if (!skillProfile) {
  //   return <div className={styles.pageWrapper}><p className={styles.emptyState}>Skill profile not available.</p></div>;
  // }

  return (
    <div className={styles.skillPageContainer}>
    
    
      <CloseButton />
      <SkillSplashScreen profile={skillProfile} />
      
      {/* <SkillSpecificHeaderCard 
        workerName={skillProfile.workerName}
        skillName={skillProfile.skillName}
        profileImageUrl={skillProfile.workerProfileImageUrl}
        isFavorited={skillProfile.isFavoritedByCurrentUser}
        onFavoriteToggle={handleFavoriteToggle}
        hashtags={skillProfile.skillHashtags}
      />

   
      {skillProfile.skillRelatedReviewSummary && (
        <p className={styles.reviewSummaryText}>{skillProfile.skillRelatedReviewSummary}</p>
      )}
      {(skillProfile.skillAbleGigs !== undefined || skillProfile.skillExperience || skillProfile.skillEph !== undefined) && (
        <InlineSummaryStats 
          ableGigs={skillProfile.skillAbleGigs}
          experience={skillProfile.skillExperience}
          eph={skillProfile.skillEph}
        />
      )}


      {skillProfile.skillPortfolio && skillProfile.skillPortfolio.length > 0 && (
        <PortfolioCarousel items={skillProfile.skillPortfolio} showPaperclipIcon />
      )}

   
      {skillProfile.skillRelevantBadges && skillProfile.skillRelevantBadges.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges Awarded</h2>
          <div className={styles.badgesContainer}>
            {skillProfile.skillRelevantBadges.map(badge => (
                <CircularBadge 
                    key={badge.id} 
                    icon={badge.icon} 
                    textLines={badge.name.split(' ')}
                />
            ))}
          </div>
        </section>
      )}

      
      {skillProfile.skillRelevantQualifications && skillProfile.skillRelevantQualifications.length > 0 && (
        <ContentCard title="Qualifications and training:">
          <ul className={styles.listSimple}> 
            {skillProfile.skillRelevantQualifications.map((q, index) => (
              <li key={index}>{q}</li>
            ))}
          </ul>
        </ContentCard>
      )}

     
      {skillProfile.skillReviews && skillProfile.skillReviews.length > 0 && (
         <TitledItemListCard
            title={`${skillProfile.skillTotalReviews !== undefined ? skillProfile.skillTotalReviews : skillProfile.skillReviews.length} Buyer Reviews`}
            icon={MessageCircleCode} 
            items={skillProfile.skillReviews}
            renderItem={(review) => <ReviewCardItem key={review.id} reviewerName={review.reviewerName} date={review.date} comment={review.comment} />}
        />
      )}
      
     
      {skillProfile.skillRecommendations && skillProfile.skillRecommendations.length > 0 && (
         <TitledItemListCard
            title="Recommendations"
            items={skillProfile.skillRecommendations}
            renderItem={(rec) => <RecommendationCardItem key={rec.id} recommenderName={rec.recommenderName} date={rec.date} comment={rec.comment} />}
        />
      )} */}

      <HireButton workerId={workerIdToView} workerName={skillProfile.name} />

    </div> 
  );
} 