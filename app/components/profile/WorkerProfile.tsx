"use client";

import SkillsDisplayTable from "@/app/components/profile/SkillsDisplayTable";
import styles from "./WorkerProfile.module.css";

import {
  updateSocialLinkWorkerProfileAction,
  updateVideoUrlWorkerProfileAction,
} from "@/actions/user/gig-worker-profile";

import PublicWorkerProfile, {
  Equipment,
  Qualification,
} from "@/app/types/workerProfileTypes";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import ProfileMedia from "./ProfileMedia";
import Qualifications from "./Qualifications";
import Equipments from "./Equipments";
import UserNameModal from "./UserNameModal";
import SocialLinkModal from "@/app/(web-client)/user/[userId]/buyer/profile/SocialLinkModal";
import RTWPopup from "./RTWPopup";
import UserInfoBar from "./UserInfoBar";
import AwardsFeedbackSection from "./AwardsFeedbackSection";
import StatisticsSection from "./StatisticsSection";

const WorkerProfile = ({
  workerProfile,
  isSelfView = false,
  handleSkillDetails,
  fetchUserProfile,
}: {
  workerProfile: PublicWorkerProfile;
  handleAddSkill?: (id: string) => void;
  handleSkillDetails: (id: string) => void;
  fetchUserProfile: (id: string) => void;
  userId?: string;
  isSelfView: boolean;
}) => {
  const { user } = useAuth();
  const [workerLink, setWorkerLink] = useState<string | null>(null);
  const [showRtwPopup, setShowRtwPopup] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  useEffect(() => {
    if (workerProfile && workerProfile.id) {
      setWorkerLink(
        `${window.location.origin}/worker/${workerProfile.id}/profile`
      );
    }
  }, [workerProfile]);

  return (
    <div className={styles.profilePageContainer}>
      {/* Top Section */}
      <ProfileMedia
        workerProfile={workerProfile}
        isSelfView={isSelfView}
        workerLink={workerLink}
        updateVideoUrlProfileAction={updateVideoUrlWorkerProfileAction}
        fetchUserProfile={fetchUserProfile}
      />
      {/* User Info Bar */}
      <UserInfoBar
        workerProfile={workerProfile}
        isSelfView={isSelfView}
        onEditName={() => setIsOpen(true)}
        onEditSocial={() => setIsSocialModalOpen(true)}
        onVerifyRTW={() => setShowRtwPopup(true)}
      />
      {/* Main content wrapper */}
      <div className={styles.mainContentWrapper}>
        {/* Statistics Section */}
        <StatisticsSection workerProfile={workerProfile} />

        {/* Skills Section */}
        {
          <SkillsDisplayTable
            skills={workerProfile?.skills}
            isSelfView={isSelfView}
            handleSkillDetails={handleSkillDetails}
            fetchUserProfile={fetchUserProfile}
            token={user?.token || ""}
          />
        }

        {/* Awards & Feedback Section */}
        {workerProfile.awards && (
          <AwardsFeedbackSection workerProfile={workerProfile} />
        )}

        {/* Qualifications Section */}
        <Qualifications
          qualifications={
            (workerProfile.qualifications as Qualification[]) ?? []
          }
          workerId={workerProfile.id}
          isSelfView={isSelfView}
          fetchUserProfile={fetchUserProfile}
        />

        {/* Equipment Section */}
        {
          <Equipments
            workerProfileId={workerProfile.id}
            equipments={(workerProfile.equipment as Equipment[]) ?? []}
            isSelfView={isSelfView}
            fetchUserProfile={fetchUserProfile}
          />
        }
      </div>
      {/* RTW Verification Popup */}
      {showRtwPopup && (
        <RTWPopup
          onClose={() => setShowRtwPopup(false)}
          userId={user?.uid || ""}
        />
      )}
      {/* Edit Name Modal */}
      {isOpen && (
        <UserNameModal
          userId={workerProfile.id || ""}
          initialValue={workerProfile.user?.fullName ?? ""}
          fetchUserProfile={fetchUserProfile}
          onClose={() => setIsOpen(false)}
        />
      )}
      {isSocialModalOpen && (
        <SocialLinkModal
          initialValue={workerProfile.socialLink ?? ""}
          onClose={() => setIsSocialModalOpen(false)}
          fetchUserProfile={() => user?.token && fetchUserProfile(user.token)}
          updateAction={updateSocialLinkWorkerProfileAction}
        />
      )}
    </div>
  );
};

export default WorkerProfile;
