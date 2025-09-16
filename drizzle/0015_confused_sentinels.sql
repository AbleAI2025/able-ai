ALTER TABLE "qualifications" ADD COLUMN "skill_id" uuid;--> statement-breakpoint
ALTER TABLE "gig_worker_profiles" ADD COLUMN "social_link" text;--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;