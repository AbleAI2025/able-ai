ALTER TABLE "gig_worker_awards" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gig_worker_worker_reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gig_worker_skills" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gig_worker_statistics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "gig_worker_awards" CASCADE;--> statement-breakpoint
DROP TABLE "gig_worker_worker_reviews" CASCADE;--> statement-breakpoint
DROP TABLE "gig_worker_skills" CASCADE;--> statement-breakpoint
DROP TABLE "gig_worker_statistics" CASCADE;--> statement-breakpoint
ALTER TABLE "gig_skills_required" ADD COLUMN "skill_id" uuid;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "able_gigs" integer;--> statement-breakpoint
ALTER TABLE "gig_skills_required" ADD CONSTRAINT "gig_skills_required_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "feedback_summary";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "qualifications";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "equipment";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "able_gigs_completed";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "average_rating";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "review_count";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "general_availability";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "experience_years";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "view_calendar_link";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "intro_video_thumbnail_url";--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" DROP COLUMN "intro_video_url";