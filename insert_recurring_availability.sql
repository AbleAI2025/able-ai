-- SQL to insert recurring availability data into worker_availability table
-- Replace 'USER_ID_HERE' with the actual user ID you want to associate this availability with

-- Insert the recurring availability pattern
INSERT INTO worker_availability (
    id,
    user_id,
    days,
    frequency,
    start_date,
    start_time_str,
    end_time_str,
    ends,
    occurrences,
    created_at,
    updated_at
) VALUES (
    'bc7820ab-a49e-461f-b01d-a0ec4c946459',
    'USER_ID_HERE',
    '["Mon", "Wed", "Fri"]'::jsonb,
    'monthly',
    '2025-09-01',
    '09:00',
    '19:00',
    'after_occurrences',
    3,
    '2025-08-18T21:26:54.523Z'::timestamp with time zone,
    '2025-08-18T21:26:54.523Z'::timestamp with time zone
);

-- Alternative: If you want to update an existing record instead
/*
UPDATE worker_availability 
SET 
    days = '["Mon", "Wed", "Fri"]'::jsonb,
    frequency = 'monthly',
    start_date = '2025-09-01',
    start_time_str = '09:00',
    end_time_str = '19:00',
    ends = 'after_occurrences',
    occurrences = 3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'bc7820ab-a49e-461f-b01d-a0ec4c946459';
*/
