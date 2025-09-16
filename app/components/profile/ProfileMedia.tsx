// app/components/profile/ProfileMedia.tsx
"use client";
import QRCodeDisplay from "./QrCodeDisplay";
import { MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./WorkerProfile.module.css";
import ProfileVideo from "./WorkerProfileVideo";
import LocationPickerBubble from "../onboarding/LocationPickerBubble";
import { useEffect, useState } from "react";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";
import { updateWorkerLocationAction } from "@/actions/user/edit-worker-profile";
import { useAuth } from "@/context/AuthContext";

interface ProfileMediaProps {
  workerProfile: PublicWorkerProfile;
  isSelfView: boolean;
  workerLink: string | null;
  onVideoUpload: (file: Blob) => void;
}

export default function ProfileMedia({
  workerProfile,
  isSelfView,
  workerLink,
  onVideoUpload,
}: ProfileMediaProps) {
  // keep location always as string
  const [location, setLocation] = useState("");
  const [tempLocation, setTempLocation] = useState(location);
  const [isPicking, setIsPicking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  // sync with profile when it changes
  useEffect(() => {
    if (workerProfile?.location) {
      const initial =
        typeof workerProfile.location === "string"
          ? workerProfile.location
          : workerProfile.location.formatted_address;
      setLocation(initial || "");
    }
  }, [workerProfile?.location]);

  // shorten address for collapsed view
  const shortAddress =
    location.length > 20 ? location.substring(0, 20) + "..." : location;

  const updateWorkerLocation = async (
    address: string,
    coord: { lat: number; lng: number }
  ) => {
    try {
      if (!user) throw new Error("User is required");

      setLocation(address);

      const { success, error } = await updateWorkerLocationAction(
        address,
        coord.lat.toString(),
        coord.lng.toString(),
        user.token
      );

      if (!success) {
        throw error || new Error("Failed to update location");
      }

      toast.success("Location updated successfully!");
      setIsPicking(false);
    } catch (error) {
      console.error("Error updating worker location:", error);
      toast.error("Error updating location");
    }
  };

  return (
    <div className={styles.profileHeaderImageSection}>
      <div className={styles.profileImageVideo}>
        <ProfileVideo
          videoUrl={workerProfile?.videoUrl}
          isSelfView={isSelfView}
          onVideoUpload={onVideoUpload}
        />
      </div>

      <div className={styles.profileHeaderRightCol}>
        {workerLink && <QRCodeDisplay url={workerLink} />}

        <div className={styles.locationShareContainer}>
          {location && (
            <div className={styles.locationInfo}>
              <button
                className={styles.editLocationButton}
                onClick={() => setIsPicking(true)}
                disabled={!isSelfView}
              >
                <MapPin size={16} color="#ffffff" className={styles.mapPin} />
              </button>

              <span
                className={styles.addressText}
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: "pointer" }}
              >
                {expanded ? location : shortAddress}
              </span>
            </div>
          )}

          {/* Location Picker Bubble */}
          {isPicking && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <button
                  className={styles.closeLocationPicker}
                  onClick={() => setIsPicking(false)}
                >
                  ✕
                </button>

                <LocationPickerBubble
                  value={tempLocation}
                  onChange={(newLocation) => {
                    const updated =
                      typeof newLocation === "string"
                        ? newLocation
                        : newLocation.formatted_address;
                    setTempLocation(updated);
                  }}
                  showConfirm
                  onConfirm={(address, coord) =>
                    updateWorkerLocation(address, coord)
                  }
                />
              </div>
            </div>
          )}

          <button
            className={styles.shareProfileButton}
            aria-label="Share profile"
            onClick={async () => {
              if (workerLink) {
                try {
                  await navigator.clipboard.writeText(workerLink);
                  toast.success("Profile link copied to clipboard!");
                } catch (err) {
                  console.error("Failed to copy link:", err);
                  toast.error("Failed to copy link. Please try manually.");
                }
              }
            }}
          >
            <Share2 size={24} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
}
