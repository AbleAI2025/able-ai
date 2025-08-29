ALTER TABLE "buyer_profiles" ADD COLUMN "response_rate_internal" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "skill_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;