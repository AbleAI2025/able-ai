CREATE TABLE "worker_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "worker_availability" ADD CONSTRAINT "worker_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "worker_availability_user_time_idx" ON "worker_availability" USING btree ("user_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "worker_availability_time_range_idx" ON "worker_availability" USING btree ("start_time","end_time");