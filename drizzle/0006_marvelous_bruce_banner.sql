ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'ACCEPTED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'EXPIRED' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'NOT_FOUND' BEFORE 'REJECTED';--> statement-breakpoint
ALTER TYPE "public"."rtw_kyc_status_enum" ADD VALUE 'LOCKED' BEFORE 'REJECTED';