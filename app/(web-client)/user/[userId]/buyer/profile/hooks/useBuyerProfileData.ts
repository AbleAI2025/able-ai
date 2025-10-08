import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getGigBuyerProfileAction } from "@/actions/user/gig-buyer-profile";
import {
  updateBusinessInfoBuyerProfileAction,
  updateVideoUrlBuyerProfileAction,
} from "@/actions/user/buyer-profile-updates";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from "sonner";
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

export function useBuyerProfileData() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;
  const isSelfView = authUserId === pageUserId;

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    fullCompanyName: "",
    location: {
      formatted_address: "",
      lat: undefined,
      lng: undefined,
    },
    companyRole: "",
  });

  const fetchUserProfile = async () => {
    const { success, profile } = await getGigBuyerProfileAction(user?.token);

    if (success && profile) {
      setDashboardData({
        ...profile,
      });
      setError(null);
    } else {
      setError("Failed to fetch profile data");
      setDashboardData(null);
    }

    setIsLoadingData(false);
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [loadingAuth, user, authUserId, pageUserId, pathname, router]);

  useEffect(() => {
    if (dashboardData) {
      console.log("Updating business info from dashboard data:", dashboardData);
      setBusinessInfo({
        fullCompanyName: dashboardData.fullCompanyName || "-",
        location: dashboardData.billingAddressJson || {
          formatted_address: "",
          lat: undefined,
          lng: undefined,
        },
        companyRole: dashboardData.companyRole || "-",
      });
    }
  }, [dashboardData]);

  const handleVideoUpload = useCallback(
    async (file: Blob) => {
      if (!user) {
        console.error("Missing required parameters for video upload");
        setError("Failed to upload video. Please try again.");
        return;
      }

      if (!file || file.size === 0) {
        console.error("Invalid file for video upload");
        setError("Invalid video file. Please try again.");
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Video file too large. Please use a file smaller than 50MB.");
        return;
      }

      try {
        const filePath = `buyer/${user.uid}/introVideo/introduction-${encodeURI(
          user.email ?? user.uid
        )}.webm`;
        const fileStorageRef = storageRef(getStorage(firebaseApp), filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
          (error) => {
            console.error("Upload failed:", error);
            setError("Video upload failed. Please try again.");
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                updateVideoUrlBuyerProfileAction(downloadURL, user.token);
                toast.success("Video upload successfully");
                fetchUserProfile();
              })
              .catch((error) => {
                console.error("Failed to get download URL:", error);
                setError("Failed to get video URL. Please try again.");
              });
          }
        );
      } catch (error) {
        console.error("Video upload error:", error);
        setError("Failed to upload video. Please try again.");
      }
    },
    [user]
  );

  const handleSave = async (updatedData: typeof businessInfo) => {
    try {
      const { success, error } = await updateBusinessInfoBuyerProfileAction(
        updatedData,
        user?.token
      );
      if (!success) {
        throw new Error("Failed to update business info: ");
      }
      toast.success("Business info updated successfully");

      setBusinessInfo(updatedData);
      fetchUserProfile();
    } catch (error) {
      console.error("Failed to update business info:", error);
      toast.error("Failed to update business info. Please try again.");
      return;
    }
  };

  return {
    dashboardData,
    isLoadingData,
    error,
    businessInfo,
    setBusinessInfo,
    handleVideoUpload,
    handleSave,
    fetchUserProfile,
    isSelfView,
    pageUserId,
    isEditingVideo,
    setIsEditingVideo,
    user,
    authUserId,
  };
}