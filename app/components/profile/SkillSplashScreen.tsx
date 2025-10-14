/* eslint-disable max-lines-per-function */
/* eslint-disable max-lines */
"use client";

import Image from "next/image";
import { Paperclip, CheckCircle, Copy, Pencil } from "lucide-react";
import styles from "./SkillSplashScreen.module.css";
import AwardDisplayBadge from "./AwardDisplayBadge";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";
import RecommendationCardItem from "@/app/components/shared/RecommendationCardItem";
import React, { useCallback, useEffect, useState } from "react";
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
import {
  updateProfileImageAction,
  updateVideoUrlWorkerSkillAction,
} from "@/actions/user/gig-worker-profile";
import ViewImageModal from "./ViewImagesModal";
import Loader from "../shared/Loader";
import ProfileVideo from "./WorkerProfileVideo";
import ScreenHeaderWithBack from "../layout/ScreenHeaderWithBack";
import { BadgeIcon } from "./GetBadgeIcon";
import Qualifications from "./Qualifications";
import HashtagsModal from "./HashtagsModal";

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
  skill,
  skillId,
  fetchSkillData,
  isSelfView,
}: // onBackClick,
{
  skill: SkillProfile | null;
  skillId: string;
  fetchSkillData: () => void;
  isSelfView: boolean;
  onBackClick: () => void;
}) => {
  const { user } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadImage, setIsUploadImage] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHashtagsModal, setShowHashtagsModal] = useState(false);

  const handleVideoUpload = useCallback(
    async (file: Blob) => {
      const toastId = toast.loading("Uploading video...");

      try {
        if (!user) {
          console.error("Missing required parameters for video upload");
          toast.error("Failed to upload video. Please try again.", { id: toastId });
          return;
        }

        if (!file || file.size === 0) {
          console.error("Invalid file for video upload");
          toast.error("Invalid video file. Please try again.", { id: toastId });
          return;
        }

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error("Video file too large. Please use a file smaller than 50MB.", { id: toastId });
          return;
        }

        const baseName = skill?.name ? encodeURIComponent(skill.name) : "introduction";

        const fileName = `workers/${
          user?.uid
        }/introVideo/${baseName}-${encodeURIComponent(
          user?.email ?? user?.uid
        )}.webm`;

        const fileStorageRef = storageRef(getStorage(firebaseApp), fileName);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.loading(`Uploading: ${Math.round(progress)}%`, {
              id: toastId,
              duration: 1000,
            });
          },
          (error) => {
            console.error("Upload failed:", error);
            toast.error("Video upload failed. Please try again.", { id: toastId });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              if (!user.token) {
                toast.error("Authentication token is required", { id: toastId });
                return;
              }

              await updateVideoUrlWorkerSkillAction(downloadURL, user.token, skillId);
              toast.success("Video uploaded successfully!", { id: toastId });
              fetchSkillData();
            } catch (error) {
              console.error("Failed to get download URL:", error);
              toast.error("Failed to get video URL. Please try again.", { id: toastId });
            }
          }
        );
      } catch (error) {
        console.error("Video upload error:", error);
        toast.error("Failed to upload video. Please try again.", { id: toastId });
      }
    },
    [user, skillId, skill]
  );

  const handleCopy = async () => {
    if (!linkUrl || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };
  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSupportingImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsUploadImage(true);
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      setIsUploadImage(false);
      return;
    }

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
      setIsUploadImage(false);
    } catch (err) {
      console.error("Error uploading profile image:", err);
      setIsUploadImage(false);
      toast.error("Error uploading profile image. Please try again.");
    }
  };

  useEffect(() => {
    if (skill && skill.workerProfileId) {
      setLinkUrl(
        `${window.location.origin}/worker/${skill.workerProfileId}/recommendation`
      );
    }
  }, [skill]);

  if (!skill) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.pageWrapper}>
      <ScreenHeaderWithBack />
      <div className={styles.skillSplashContainer}>
        <div className={styles.header}>
          <div className={styles.videoContainer}>
            <ProfileVideo
              videoUrl={skill.videoUrl}
              isSelfView={isSelfView}
              onVideoUpload={handleVideoUpload}
            />
          </div>

          <h2 className={styles.name}>
            {skill.name?.split(" ")[0]}: {skill.title}
          </h2>
        </div>

        {/* Hashtags */}
        {skill.hashtags && skill.hashtags.length > 0 && (
          <div className={styles.hashtags}>
            {skill.hashtags.map((tag, index) => (
              <span key={index} className={styles.hashtag}>
                {tag}
              </span>
            ))}
            <button
              className={styles.editHashtagsBtn}
              onClick={() => setShowHashtagsModal(true)}
            >
              <Pencil size={18} />
            </button>
          </div>
        )}

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
              <td>{skill.ableGigs ?? 0}</td>
              <td>{skill.experienceYears} years</td>
              <td>£{skill.Eph}</td>
            </tr>
          </tbody>
        </table>

        {/* Statistics */}
        <div className={styles.section}>
          <h3>{skill.name}’s statistics</h3>
          <div className={styles.statistics}>
            <div className={styles.stats}>
              <Image
                src="/images/reviews.svg"
                alt="Reviews"
                width={27}
                height={32}
              />
              <p>
                {skill.statistics.reviews}
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
                £{skill.statistics.paymentsCollected}
                <span>Payments collected</span>
              </p>
            </div>
            <div className={styles.stats}>
              <Image src="/images/tips.svg" alt="Tips" width={46} height={30} />
              <p>
                £{skill.statistics.tipsReceived}
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
              {skill.supportingImages?.length ? (
                skill.supportingImages.map((img, i) => (
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
                    {!isUploadImage ? (
                      <Paperclip size={29} color="#ffffff" />
                    ) : (
                      <Loader
                        customClass={styles.loaderCustom}
                        customStyle={{
                          width: "auto",
                          height: "auto",
                          minHeight: 0,
                          backgroundColor: "#121212",
                        }}
                      />
                    )}
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
        {
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Badges Awarded</h3>
            <div className={styles.badges}>
              {skill.badges && skill.badges.length > 0
                ? skill.badges.map((badge) => (
                    <div className={styles.badge} key={badge.id}>
                      <AwardDisplayBadge
                        icon={badge.icon as BadgeIcon}
                        title={badge.name}
                        role="buyer"
                        type={badge.type}
                      />
                    </div>
                  ))
                : "No badges yet."}
            </div>
          </div>
        }

        {/* Qualifications */}
        <Qualifications
          qualifications={skill?.qualifications || []}
          isSelfView={isSelfView}
          workerId={skill.workerProfileId || ""}
          fetchUserProfile={() => fetchSkillData()}
          skillId={skillId}
        />
        {/* Buyer Reviews */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Buyer Reviews</h3>
          {skill?.buyerReviews && skill.buyerReviews.length > 0 ? (
            skill.buyerReviews.map((review, index) => (
              <ReviewCardItem
                key={index}
                reviewerName={review?.author?.fullName || "Unknown"}
                date={review?.createdAt?.toString()}
                comment={review?.comment}
              />
            ))
          ) : (
            <p className={styles.emptyMessage}>No buyer reviews yet.</p>
          )}
        </div>

        {/* Recommendations */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommendations</h3>
          {skill?.recommendations && skill.recommendations.length > 0 ? (
            skill.recommendations.map((recommendation, index) => (
              <RecommendationCardItem
                key={index}
                recommenderName={
                  recommendation?.author?.fullName ||
                  recommendation?.recommenderName ||
                  "Unknown"
                }
                date={recommendation?.createdAt?.toString()}
                comment={recommendation?.comment}
              />
            ))
          ) : (
            <p className={styles.emptyMessage}>No recommendations yet.</p>
          )}
        </div>

        {showHashtagsModal && (
          <HashtagsModal
            initialValue={skill.hashtags || []}
            fetchSkillData={() => fetchSkillData()}
            onClose={() => setShowHashtagsModal(false)}
          />
        )}

        {isSelfView && linkUrl && navigator.clipboard && (
          <div className={styles.footerAction}>
            <button
              type="button"
              onClick={handleCopy}
              className={styles.share_button}
            >
              {copied ? (
                <CheckCircle size={16} className={styles.copiedIcon} />
              ) : (
                <Copy size={16} className={styles.copiedIcon} />
              )}
              <span>Generate link to ask for a recommendation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSplashScreen;
