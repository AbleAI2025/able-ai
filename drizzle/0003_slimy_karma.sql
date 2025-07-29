CREATE TABLE "gig_worker_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"icon" varchar(255) NOT NULL,
	"text_lines" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "gig_worker_awards_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "gig_worker_worker_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"worker_name" varchar(255) NOT NULL,
	"review_text" text NOT NULL,
	"rating" integer NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"worker_avatar_url" varchar(512),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "gig_worker_worker_reviews_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "gig_worker_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"able_gigs" varchar(255),
	"experience" varchar(255),
	"eph" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "gig_worker_skills_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "gig_worker_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"icon" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"icon_color" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "gig_worker_statistics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "email_gig_updates" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "email_platform_announcements" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_preferences" ALTER COLUMN "sms_gig_alerts" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "feedback_summary" text;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "qualifications" jsonb;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "equipment" jsonb;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "able_gigs_completed" numeric;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "average_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "review_count" integer;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "general_availability" varchar(255);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "experience_years" varchar(255);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "view_calendar_link" varchar(512);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "intro_video_thumbnail_url" varchar(512);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "intro_video_url" varchar(512);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_visibility" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gig_worker_awards" ADD CONSTRAINT "gig_worker_awards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_worker_worker_reviews" ADD CONSTRAINT "gig_worker_worker_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_worker_skills" ADD CONSTRAINT "gig_worker_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_worker_statistics" ADD CONSTRAINT "gig_worker_statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;