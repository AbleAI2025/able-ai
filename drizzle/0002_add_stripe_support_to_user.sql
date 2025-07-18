CREATE TYPE "public"."stripe_account_status_enum" AS ENUM('connected', 'pending_verification', 'incomplete', 'restricted', 'disabled');--> statement-breakpoint
ALTER TABLE "escalated_issues" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "escalated_issues" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "system_flags" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "system_flags" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_ai_usage" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_ai_usage" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_receive_payouts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_status" "stripe_account_status_enum";