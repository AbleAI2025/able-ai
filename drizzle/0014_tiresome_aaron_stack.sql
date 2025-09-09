CREATE TYPE "public"."gig_amendment_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "gig_amendment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb NOT NULL,
	"status" "gig_amendment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"reason" text,
	"responder_notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gig_amendment_requests" ADD CONSTRAINT "gig_amendment_requests_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_amendment_requests" ADD CONSTRAINT "gig_amendment_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;