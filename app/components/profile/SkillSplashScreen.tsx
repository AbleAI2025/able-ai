"use client";

import Image from "next/image";
import { Star, Paperclip } from "lucide-react";
import styles from "./SkillSplashScreen.module.css";
import AwardDisplayBadge from "./AwardDisplayBadge";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";
import RecommendationCardItem from "@/app/components/shared/RecommendationCardItem";
import React, { useState } from "react";
import { SkillProfile } from "@/app/(web-client)/user/[userId]/worker/profile/skills/[skillId]/schemas/skillProfile";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateProfileImageAction } from "@/actions/user/gig-worker-profile";
import ViewImageModal from "./ViewImagesModal";

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
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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

const SkillSplashScreen = ({
  profile,
  skillId,
  fetchSkillData,
  isSelfView,
}: {
  profile: SkillProfile | null;
  skillId: string;
  fetchSkillData: () => void;
  isSelfView: boolean;
}) => {
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSupportingImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const timestamp = Date.now();
    const path = `users/${user.uid}/profileImage/image-${encodeURI(
      user.email ?? user.uid
    )}-${timestamp}.jpg`;

    try {
      const downloadURL = await uploadImageToFirestore(
        file,
        path,
        (progress) => {
          console.log(`Image upload progress: ${progress.toFixed(2)}%`);
        }
      );

      await updateProfileImageAction(user.token, skillId, downloadURL);

      await fetchSkillData();
    } catch (err) {
      console.error("Error uploading profile image:", err);
    }
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
      <>
        <h4>Images</h4>
        <div className={styles.supportingImages}>
          <div className={styles.images}>
            {profile.supportingImages?.length ? (
              profile.supportingImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  style={{ cursor: "pointer" }}
                >
                  <Image src={img} alt={`Img ${i}`} width={109} height={68} />
                </div>
              ))
            ) : (
              <p>No images available</p>
            )}

            {isSelfView && (
              <>
                <button
                  className={styles.attachButton}
                  onClick={handleAddImageClick}
                >
                  <Paperclip size={29} color="#ffffff" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={handleSupportingImageUpload}
                />
              </>
            )}
          </div>
        </div>

        {/* Modal para ver las imágenes en grande */}
        <ViewImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage!}
          userToken={user?.token || ""}
          skillId={skillId}
          isSelfView={isSelfView}
          fetchSkillData={fetchSkillData}
        />
      </>

      {/* Badges */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Badges Awarded</h3>
        <div className={styles.badges}>
          {profile.badges.map((badge) => (
            <div className={styles.badge} key={badge.id}>
              <AwardDisplayBadge
                {...(badge?.badge?.icon ? { icon: badge.badge?.icon } : {})}
                textLines={badge?.badge?.description ?? ""}
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
            <li key={index}>
              {q.title}: {q.description}
            </li>
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
    </div>
  );
};

export default SkillSplashScreen;
