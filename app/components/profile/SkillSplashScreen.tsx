'use client';

import Image from 'next/image';
import { Star, Paperclip } from 'lucide-react';
import styles from './SkillSplashScreen.module.css';
import { useParams } from 'next/navigation';
import AwardDisplayBadge from './AwardDisplayBadge';
import ReviewCardItem from '@/app/components/shared/ReviewCardItem';
import RecommendationCardItem from '@/app/components/shared/RecommendationCardItem';
import React from 'react';

export type Profile = {
  name: string;
  title: string;
  hashtags: string;
  customerReviewsText: string;
  ableGigs: number;
  experienceYears: number;
  Eph: number;
  statistics: {
    reviews: number;
    paymentsCollected: string;
    tipsReceived: string;
  };
  supportingImages: string[];
  badges: {
    id: string | number;
    icon: React.ElementType;
    textLines: string[] | string;
  }[];
  qualifications: string[];
  buyerReviews: {
    name: string;
    date: string;
    text: string;
  }[];
  recommendation?: {
    name: string;
    date: string;
    text: string;
  };
};

const SkillSplashScreen = ({profile}: {profile: Profile}) => {
    const params = useParams();
    const skill = params?.skillId as string;

    const handleAddImage = () => {
        // Logic to handle adding an image
        // open file picker or modal to select an image
        console.log("Add image button clicked");
    }
  return (
    <div className={styles.skillSplashContainer}>
      {/* Header */}
      <div className={styles.header}>
        <Image src="/images/benji.jpeg" alt="Profile picture" width={115} height={86} className={styles.profileImage} />
        <h2 className={styles.name}>{profile.name}: {skill}</h2>
        <Star className={styles.icon} />
      </div>

      {/* Hashtags */}
      <div className={styles.hashtags}>
        {profile.hashtags}
      </div>

      {/* Customer reviews */}
      <p className={styles.review}>
        Customer reviews: {profile.customerReviewsText}
      </p>

      <table className={styles.skillDisplayTable}>
        <thead>
          <tr>
            <th>Able Gigs</th>
            <th>Experience</th>
            <th>£ph</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{profile.ableGigs}</td>
            <td>{profile.experienceYears} years</td>
            <td>£{profile.Eph}</td>
          </tr>
        </tbody>
      </table>

      {/* Statistics */}
      <div className={styles.section}>
        <h3>{profile.name}’s statistics</h3>
        <div className={styles.statistics}>
          <div className={styles.stats}>
            <Image src="/images/reviews.svg" alt="Reviews" width={27} height={32} />
            <p>{profile.statistics.reviews}<span>Customer reveiws</span></p>
          </div>
          <div className={styles.stats}>
            <Image src="/images/payments.svg" alt="Payments" width={38} height={31} />
            <p>{profile.statistics.paymentsCollected}<span>Payments collceted</span></p>
          </div>
          <div className={styles.stats}>
            <Image src="/images/tips.svg" alt="Tips" width={46} height={30} />
            <p>{profile.statistics.tipsReceived}<span>Tips received</span></p>
          </div>
        </div>
      </div>

      {/* Image placeholders */}
      <div className={styles.supportingImages}>
        <div className={styles.images}>
          { profile.supportingImages.map((image: string, index: number) => (
              <Image key={index} src={image} alt={`Supporting image ${index + 2}`} width={109} height={68} />
          ))}
        </div>
        <button className={styles.attachButton} onClick={handleAddImage}>
          <Paperclip size={29} color='#ffffff'/>
        </button>
        <input type="file" accept="image/*" className={styles.hiddenInput} />
      </div>

      {/* Badges */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Badges Awarded</h3>
        <div className={styles.badges}>
          
            {profile.badges.map((badge: Profile["badges"][number]) => {
              return (
                <div className={styles.badge} key={badge.id}>
                  <AwardDisplayBadge
                    icon={badge.icon}
                    textLines={badge.textLines as string}
                  />
                </div>
            )})}   
        </div>
      </div>

      {/* Qualifications */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Qualifications and training:</h3>
        <ul className={styles.list}>
          <li>Bachelor’s Degree in Graphic Design</li>
          <li>Licensed bar manager</li>
          <li>Cocktail preparation diploma</li>
        </ul>
      </div>

      {/* Buyer Reviews */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Buyer Reviews</h3>
        {
          profile.buyerReviews.map((review: Profile["buyerReviews"][number], index: number) => (
            // <div className={styles.reviewCard} key={index}>
            //   <p><strong>{review.name} - {review.date}</strong></p>
            //   <p>“{review.text}”</p>
            // </div>
            <ReviewCardItem key={index} reviewerName={review.name} date={review.date} comment={review.text} />
          ))
        }
      </div>

      {/* Recommendations */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recommendations</h3>
        {
          profile.recommendation && (
            <RecommendationCardItem
              recommenderName={profile.recommendation.name}
              date={profile.recommendation.date}
              comment={profile.recommendation.text}
            />
          )
        }
      </div>
    </div>
  )
}

export default SkillSplashScreen
