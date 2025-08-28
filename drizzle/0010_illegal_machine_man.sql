ALTER TABLE "gigs" ADD COLUMN "final_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "final_hours" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "final_agreed_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "adjustment_notes" text;--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "adjusted_at" timestamp with time zone;--> statement-breakpoint