import Link from 'next/link'
import VideoRecorderBubble from '../onboarding/VideoRecorderBubble'
import styles from './BuyerProfileVideo.module.css'
import DashboardData from '@/app/types/BuyerProfileTypes'
import { Pencil, Video } from 'lucide-react'

interface BuyerProfileProps {
  dashboardData: DashboardData
  isSelfView: boolean
  isEditingVideo: boolean
  setIsEditingVideo: (isEditing: boolean) => void
  handleVideoUpload: (video: Blob) => void
}

const BuyerProfileVideo = ({
  dashboardData,
  isSelfView,
  isEditingVideo,
  setIsEditingVideo,
  handleVideoUpload
}: BuyerProfileProps) => {

if (!dashboardData?.videoUrl && !isEditingVideo) {
  return isSelfView ? (
    <div className={styles.videoIntroPrompt}>
      <h5>
        Please, <br />
        introduce yourself
      </h5>
      <VideoRecorderBubble
        key={1}
        onVideoRecorded={handleVideoUpload}
      />
    </div>
  ) : (
    <p className={styles.videoPlaceholderText}>
      User presentation not exist
    </p>
  );
}

if (isEditingVideo) {
  return (
    <div className={styles.recorderWrapper}>
        <VideoRecorderBubble
          key={2}
          onVideoRecorded={(video) => {
            handleVideoUpload(video);
            setIsEditingVideo(false);
          }}
          setIsEditingVideo={setIsEditingVideo}
        />
      </div>
  );
}

  return (
     <div className={styles.videoThumbnailContainer}>
        <span className={styles.videoThumbnailTitle}>Intro Video</span>
        <div className={styles.videoPlaceholderImage}>
          <div className={styles.videoWrapper}>
            <Link
              href={dashboardData.videoUrl!}
              target="_blank"
              rel="noopener noreferrer"
                className={styles.videoLink}
              >
                <video
                  width="120"
                  height="120"
                  className={styles.videoPreview}
                  preload="metadata"
                  muted
                  poster="/video-placeholder.jpg"
                >
                  <source
                    src={dashboardData.videoUrl + "#t=0.1"}
                    type="video/webm"
                  />
                </video>
              </Link>

              {isSelfView && dashboardData?.videoUrl && (
                <button
                  onClick={() => setIsEditingVideo(true)}
                  className={styles.editIconButton}
                  aria-label="Edit video"
                >
                  <Pencil size={18} />
                </button>
              )}

             <Video  
                color='#ffd700'
                fill='#ffd700' 
                className={styles.videoIcon} 
              />
            </div>
        </div>
      </div>
  )
}

export default BuyerProfileVideo
