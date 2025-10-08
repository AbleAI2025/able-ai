import { Pencil } from "lucide-react";
import styles from "../BuyerProfilePage.module.css";
import BuyerProfileVideo from "@/app/components/profile/BuyerProfileVideo";
import DashboardData from "@/app/types/BuyerProfileTypes";

interface BusinessInfo {
  fullCompanyName: string;
  location: {
    formatted_address: string;
    lat: number | undefined;
    lng: number | undefined;
  };
  companyRole: string;
}

interface IntroSectionProps {
  dashboardData: DashboardData;
  businessInfo: BusinessInfo;
  isSelfView: boolean;
  isEditingVideo: boolean;
  setIsEditingVideo: (editing: boolean) => void;
  handleVideoUpload: (file: Blob) => void;
  onEditBusiness: () => void;
}

export default function IntroSection({
  dashboardData,
  businessInfo,
  isSelfView,
  isEditingVideo,
  setIsEditingVideo,
  handleVideoUpload,
  onEditBusiness,
}: IntroSectionProps) {
  return (
    <section className={`${styles.section} ${styles.introCard}`}>
      <BuyerProfileVideo
        dashboardData={dashboardData}
        isSelfView={isSelfView}
        isEditingVideo={isEditingVideo}
        setIsEditingVideo={setIsEditingVideo}
        handleVideoUpload={handleVideoUpload}
      />

      <div className={styles.businessInfoCard}>
        <div className={styles.headerRow}>
          <button
            onClick={onEditBusiness}
            className={styles.editInfoBtn}
          >
            <Pencil size={20} />
          </button>
        </div>

        <h4>Business:</h4>
        <p>{businessInfo?.fullCompanyName || "Not provided"}</p>

        <span className={styles.location}>
          {businessInfo?.location?.formatted_address || "Not provided"}
        </span>

        <h4>Role:</h4>
        <p>{businessInfo?.companyRole || "Not provided"}</p>
      </div>
    </section>
  );
}