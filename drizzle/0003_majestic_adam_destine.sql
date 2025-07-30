ALTER TABLE "notification_preferences" ALTER COLUMN "email_gig_updates" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "email_platform_announcements" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "sms_gig_alerts" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "gig_skills_required" ADD COLUMN "skill_id" uuid;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "able_gigs" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_visibility" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gig_skills_required" ADD CONSTRAINT "gig_skills_required_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;