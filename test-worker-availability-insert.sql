-- Test insert into worker_availability table
-- First, let's see what users exist
SELECT id, firebase_uid, full_name FROM users LIMIT 5;

-- Then try to insert a test availability record
-- Replace 'USER_ID_HERE' with an actual user ID from the query above

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
    gen_random_uuid(),
    'USER_ID_HERE', -- Replace with actual user ID
    '["Mon", "Wed", "Fri"]'::jsonb,
    'weekly',
    '2025-09-01',
    '09:00',
    '17:00',
    'after_occurrences',
    3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Check if the insert worked
SELECT * FROM worker_availability;
