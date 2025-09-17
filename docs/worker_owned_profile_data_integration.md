# Worker Owned Profile Data Integration

This document explains how to replace the mock data currently used in the `WorkerOwnedProfilePage` component (`app/user/[userId]/worker/profile/page.tsx`) with actual profile data fetched from your backend API.

## 1. Identify the Mock Data Function

The mock data for the worker's own profile is currently being fetched by the `fetchWorkerOwnedProfile` async function within the `app/user/[userId]/worker/profile/page.tsx` file. This function uses a hardcoded `qaMockProfileData` when the `isViewQA` flag is enabled.

```typescript
// Mock data for QA testing
const qaMockProfileData = { /* ... mock data structure ... */ };

// Mock data fetch for the worker's own profile
async function fetchWorkerOwnedProfile(userId: string, isViewQA: boolean) {
  // --- REAL DATA FETCH LOGIC GOES HERE ---
  console.log("Attempting to fetch real worker profile for userId:", userId);
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate fetch delay
  // ... currently falls back to returning mock data for demo ...
}
```

## 2. Implement Backend API Endpoint

You will need a backend API endpoint that, given the authenticated user's ID (which should match the `[userId]` parameter in the route), fetches their specific worker profile data from your database.

This endpoint should be **authenticated** and **authorized** to ensure only the logged-in user can access their own profile data. The data returned should be structured similarly to the data currently consumed by the `WorkerOwnedProfilePage` component, including fields for:

-   `id`
-   `displayName`
-   `userHandle`
-   `profileHeadline`
-   `avatarUrl`
-   `location`
-   `isVerified`
-   `viewCalendarLink`
-   `skills` (array)
-   `qualifications` (array)
-   `equipment` (array)
-   `bio`
-   (Potentially more private details not shown on the public profile)

Example endpoint structure (using Next.js API routes): `/api/user/{userId}/worker-profile` (where `userId` is typically derived from the authenticated session, not directly from the URL parameter for security).

## 3. Replace Mock Data Logic with API Call

Modify the `fetchWorkerOwnedProfile` function to perform a real API call to your backend endpoint when `isViewQA` is `false`.

```typescript
async function fetchWorkerOwnedProfile(userId: string, isViewQA: boolean): Promise<any | null> {
  try {
    // Replace with your actual authenticated API endpoint path
    // Ensure your fetch includes authentication headers (e.g., Authorization: Bearer <token>)
    const response = await fetch(`/api/user/${userId}/worker-profile`, {
      headers: {
        'Authorization': `Bearer {YOUR_AUTH_TOKEN}`, // Replace with logic to get token
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API Error fetching worker owned profile for ${userId}: ${response.status}`);
      // Handle specific error statuses (e.g., 401 Unauthorized, 403 Forbidden, 404 Not Found)
      if (response.status === 404) return null; // Profile not found (unlikely for owned profile)
      throw new Error(`Failed to fetch worker profile: ${response.statusText}`);
    }

    const profileData = await response.json();
    return profileData; // This data should match the expected structure

  } catch (error) {
    console.error("Error fetching worker owned profile:", error);
    // Handle network errors
    throw error; // Re-throw to be caught by the component's useEffect
  }
}
```

**Important:** The example `fetch` call uses `{YOUR_AUTH_TOKEN}` as a placeholder. You must implement the logic to securely retrieve and include the user's authentication token in the request headers.

## 4. Component State Handling

The existing `useEffect` hook in `WorkerOwnedProfilePage` that calls `fetchWorkerOwnedProfile` already handles the loading and error states. As long as your API returns data in a compatible structure (an object with the required profile fields, or `null` if an error prevents fetching), the component's rendering logic based on `isLoading || loadingProfile`, `error`, and `profile` will work correctly.

## 5. Backend Authentication and Authorization

On your backend, the `/api/user/{userId}/worker-profile` endpoint must:

-   Verify the authentication token provided in the request headers.
-   Confirm that the authenticated user's ID matches the `userId` requested in the route (or is authorized to view this specific profile, though typically a user only views their own owned profile). This is crucial for security.
-   Fetch the data from the database.
-   Return the worker profile data or an appropriate error response (e.g., 401, 403, 404).

By following these steps, you can successfully integrate your backend data with the `WorkerOwnedProfilePage` component. 