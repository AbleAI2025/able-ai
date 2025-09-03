CREATE TYPE "public"."discount_type_enum" AS ENUM('USER_REFERRAL', 'PLATFORM_DISCOUNT', 'ONE_TIME_DISCOUNT');--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_amount" numeric(10, 2),
	"discount_percentage" numeric(5, 2),
	"type" "discount_type_enum" NOT NULL,
	"user_id" uuid NOT NULL,
	"already_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "badge_definitions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."badge_type_enum";--> statement-breakpoint
CREATE TYPE "public"."badge_type_enum" AS ENUM('COMMON', 'EARLY_JOINER', 'OTHER');--> statement-breakpoint
ALTER TABLE "badge_definitions" ALTER COLUMN "type" SET DATA TYPE "public"."badge_type_enum" USING "type"::"public"."badge_type_enum";--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "discount_code_id" uuid;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE no action ON UPDATE no action;