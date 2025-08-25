-- Check the gig_worker_profiles table where the availability data actually exists
SELECT 
    id,
    user_id,
    availability_json,
    created_at,
    updated_at
FROM gig_worker_profiles 
WHERE availability_json IS NOT NULL 
   AND availability_json != '[]'::jsonb
LIMIT 10;

-- Check all gig_worker_profiles records
SELECT COUNT(*) as total_profiles FROM gig_worker_profiles;

-- Check profiles with availability data
SELECT COUNT(*) as profiles_with_availability 
FROM gig_worker_profiles 
WHERE availability_json IS NOT NULL 
   AND availability_json != '[]'::jsonb;
