"use client";

import Image from "next/image";
import { Star, Paperclip } from "lucide-react";
import styles from "./SkillSplashScreen.module.css";
import AwardDisplayBadge from "./AwardDisplayBadge";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";
import RecommendationCardItem from "@/app/components/shared/RecommendationCardItem";
import React from "react";
import { SkillProfile } from "@/app/(web-client)/user/[userId]/worker/profile/skills/[skillId]/schemas/skillProfile";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from 'sonner';
import { useAuth } from "@/context/AuthContext";
import { updateProfileImageAction } from "@/actions/user/gig-worker-profile";

async function uploadImageToFirestore(
  file: Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const storage = getStorage(firebaseApp);
      const fileRef = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Image upload failed:", error);
          toast.error("Image upload failed. Please try again.");
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            toast.success("Image uploaded successfully");
            resolve(downloadURL);
          } catch (err) {
            console.error("Failed to get download URL:", err);
            reject(err);
          }
        }
      );
    } catch (err) {
      console.error("Unexpected error during image upload:", err);
      reject(err);
    }
  });
}

const SkillSplashScreen = ({profile}:{profile: SkillProfile | null}) => {
  const {user} = useAuth();

  const handleAddImage = () => {
    console.log("Add image button clicked");
  };

  if (!profile) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.skillSplashContainer}>
      {/* Header */}
      <div className={styles.header}>
        <Image
          src="/images/benji.jpeg"
          alt="Profile picture"
          width={115}
          height={86}
          className={styles.profileImage}
        />
        <h2 className={styles.name}>
          {profile.name}: {profile.title}
        </h2>
        <Star className={styles.icon} />
      </div>

      {/* Hashtags */}
      <div className={styles.hashtags}>{profile.hashtags}</div>

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
            <Image
              src="/images/reviews.svg"
              alt="Reviews"
              width={27}
              height={32}
            />
            <p>
              {profile.statistics.reviews}
              <span>Customer reviews</span>
            </p>
          </div>
          <div className={styles.stats}>
            <Image
              src="/images/payments.svg"
              alt="Payments"
              width={38}
              height={31}
            />
            <p>
              {profile.statistics.paymentsCollected}
              <span>Payments collected</span>
            </p>
          </div>
          <div className={styles.stats}>
            <Image src="/images/tips.svg" alt="Tips" width={46} height={30} />
            <p>
              {profile.statistics.tipsReceived}
              <span>Tips received</span>
            </p>
          </div>
        </div>
      </div>

      {/* Image placeholders */}
      <div className={styles.supportingImages}>
        <div className={styles.images}>
          {profile.supportingImages.map((image: string, index: number) => (
            <Image
              key={index}
              src={image}
              alt={`Supporting image ${index + 1}`}
              width={109}
              height={68}
            />
          ))}

        </div>
        <button className={styles.attachButton} onClick={handleAddImage}>
          <Paperclip size={29} color="#ffffff" />
        </button>
        <input type="file" accept="image/*" className={styles.hiddenInput} />
      </div>

      {/* Badges */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Badges Awarded</h3>
        <div className={styles.badges}>
          {profile.badges.map((badge) => (
            <div className={styles.badge} key={badge.id}>
              <AwardDisplayBadge
                {...(badge?.icon ? { icon: badge.icon } : {})}
                textLines={badge.notes}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Qualifications */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Qualifications and training:</h3>
        <ul className={styles.list}>
          {profile?.qualifications?.map((q, index) => (
            <li key={index}>{q.title}: {q.description}</li>
          ))}
        </ul>
      </div>

      {/* Buyer Reviews */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Buyer Reviews</h3>
        {profile?.buyerReviews?.map((review, index) => (
          <ReviewCardItem
            key={index}
            reviewerName={review?.name}
            date={review?.date.toString()}
            comment={review?.text}
          />
        ))}
      </div>

      {/* Recommendations */}
      {profile.recommendation && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommendations</h3>
          <RecommendationCardItem
            recommenderName={profile.recommendation.name}
            date={profile.recommendation.date}
            comment={profile.recommendation.text}
          />
        </div>
      )}
        {true && (
    <>
      <label
        htmlFor="profile-image-upload"
        style={{
          display: "inline-block",
          marginTop: "8px",
          padding: "6px 12px",
          backgroundColor: "#0070f3",
          color: "#fff",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Upload Profile Image
      </label>
      <input
        id="profile-image-upload"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !user) return;

          const path = `users/${user.uid}/profileImage/profile-${encodeURI(user.email ?? user.uid)}.jpg`;
          try {
            const downloadURL = await uploadImageToFirestore(file, path, (progress) => {
              console.log(`Image upload progress: ${progress.toFixed(2)}%`);
            });

            console.log("downloadURL: ", downloadURL);
            
            await updateProfileImageAction(user.token, "", []);

            //await getPrivateWorkerProfileAction(user.token);
          } catch (err) {
            console.error("Error uploading profile image:", err);
          }
        }}
      />
    </>
  )}
    </div>
  );
};

export default SkillSplashScreen;
