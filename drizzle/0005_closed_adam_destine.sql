ALTER TABLE "gig_worker_profiles" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "hash_tags" jsonb;