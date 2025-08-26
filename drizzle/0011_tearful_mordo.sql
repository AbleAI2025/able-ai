ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'ACCEPTED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'EXPIRED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'NOT_FOUND' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'LOCKED' BEFORE 'REJECTED';--> statement-breakpoint
CREATE TABLE "worker_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"days" jsonb,
	"frequency" varchar(50),
	"start_date" varchar(50),
	"start_time_str" varchar(10),
	"end_time_str" varchar(10),
	"ends" varchar(50),
	"occurrences" integer,
	"end_date" varchar(50),
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD COLUMN "response_rate_internal" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "worker_availability" ADD CONSTRAINT "worker_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_availability_user_time_idx" ON "worker_availability" USING btree ("user_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "worker_availability_time_range_idx" ON "worker_availability" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "worker_availability_user_pattern_idx" ON "worker_availability" USING btree ("user_id","frequency","start_date");