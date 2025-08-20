-- Check where the availability data actually exists
-- First, let's see what's in the gig_worker_profiles table

SELECT 
    id,
    user_id,
    availability_json,
    created_at,
    updated_at
FROM gig_worker_profiles 
WHERE availability_json IS NOT NULL 
   OR availability_json != '[]'::jsonb
LIMIT 10;

-- Also check the worker_availability table to confirm it's empty
SELECT COUNT(*) as worker_availability_count FROM worker_availability;

-- Check if there are any users with availability data
SELECT 
    u.id,
    u.full_name,
    u.firebase_uid,
    gwp.availability_json
FROM users u
LEFT JOIN gig_worker_profiles gwp ON u.id = gwp.user_id
WHERE gwp.availability_json IS NOT NULL 
   AND gwp.availability_json != '[]'::jsonb
LIMIT 5;
