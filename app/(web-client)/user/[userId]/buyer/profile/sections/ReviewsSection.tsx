import styles from "../BuyerProfilePage.module.css";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";
import DashboardData from "@/app/types/BuyerProfileTypes";

interface ReviewsSectionProps {
  dashboardData: DashboardData;
}

export default function ReviewsSection({ dashboardData }: ReviewsSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Worker Reviews</h2>
      {dashboardData?.reviews?.length > 0 ? (
        <div className={styles.reviewsListContainer}>
          {dashboardData?.reviews.map((review, index) => (
            <ReviewCardItem
              key={index}
              reviewerName={review.name}
              date={review.date.toString()}
              comment={review.text}
            />
          ))}
        </div>
      ) : (
        <p className={styles.noReviews}>No worker reviews yet.</p>
      )}
    </section>
  );
}