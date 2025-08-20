-- Migration to add recurring availability fields to worker_availability table
-- This supports the recurring availability pattern with days, frequency, occurrences, etc.

-- Add new fields for recurring availability patterns
ALTER TABLE "worker_availability" ADD COLUMN "days" jsonb;
ALTER TABLE "worker_availability" ADD COLUMN "frequency" varchar(50);
ALTER TABLE "worker_availability" ADD COLUMN "start_date" varchar(50);
ALTER TABLE "worker_availability" ADD COLUMN "start_time_str" varchar(10); -- For recurring pattern time like "09:00"
ALTER TABLE "worker_availability" ADD COLUMN "end_time_str" varchar(10); -- For recurring pattern time like "19:00"
ALTER TABLE "worker_availability" ADD COLUMN "ends" varchar(50);
ALTER TABLE "worker_availability" ADD COLUMN "occurrences" integer;
ALTER TABLE "worker_availability" ADD COLUMN "end_date" varchar(50);

-- Add index for recurring pattern queries
CREATE INDEX "worker_availability_user_pattern_idx" ON "worker_availability" USING btree ("user_id", "frequency", "start_date");

-- Note: We keep the existing start_time and end_time columns for individual time slots
-- The new start_time_str and end_time_str are for recurring pattern times
