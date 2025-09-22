# Calendar Backend Integration Guide

This document explains how to integrate the calendar pages (worker and buyer) with a backend API for real event data, replacing the current mock/QA mode.

## 1. API Contract

The backend should expose endpoints to:
- **Fetch events** for a user (worker or buyer)
- **Create/update/delete events** (optional, for availability or gig management)
- **Filter events** by status/type (optionally server-side)

**Example REST endpoints:**
- `GET /api/calendar/events?role=worker&userId=...`
- `POST /api/calendar/events` (for creating new events)
- `PATCH /api/calendar/events/:eventId` (for updating)
- `DELETE /api/calendar/events/:eventId`

**Event object shape (TypeScript):**
```ts
interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  allDay?: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'UNAVAILABLE' | 'OFFER';
  eventType?: 'gig' | 'offer' | 'unavailability';
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
}
```

## 2. Fetching Events

Replace the mock event logic in the calendar pages with an API call:

- In `useEffect`, fetch events from the backend when the component mounts or when filters change.
- Use the user's role and ID to fetch the correct events.
- Parse the response and convert date strings to `Date` objects for the calendar.

**Example (inside WorkerCalendarPage):**
```ts
useEffect(() => {
  async function fetchEvents() {
    if (typeof window !== 'undefined') {
      const isViewQA = localStorage.getItem('isViewQA') === 'true';

      // Replace with your API endpoint and auth logic
      const res = await fetch(`/api/calendar/events?role=worker&userId=${userId}`);
      const data = await res.json();
      // Convert date strings to Date objects
      const parsed = data.events.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
      setEvents(filterEvents(parsed, activeFilter));
    }
  }
  fetchEvents();
}, [activeFilter, userId]);
```

## 3. Filtering

- You can filter events client-side (as now) or pass filter params to the backend for server-side filtering.
- For server-side filtering, add query params like `?status=ACCEPTED` to your API call.

## 4. Authentication

- Use your existing authentication (e.g., Firebase Auth) to get a user token.
- Pass the token in the `Authorization` header of your API requests.
- Example:
```ts
const token = await user.getIdToken();
fetch('/api/calendar/events', { headers: { Authorization: `Bearer ${token}` } });
```

## 5. Updating Events

- To allow users to create, update, or delete events, call the appropriate backend endpoints on user actions (e.g., accepting a gig, marking unavailable).
- Update the local state after a successful API response.

## 6. QA/Mock Mode

- Keep the `isViewQA` logic: if `localStorage.getItem('isViewQA') === 'true'`, use mock events instead of calling the backend.
- This is useful for development and QA testing.

## 7. Where to Place API Calls

- Place API calls in the `useEffect` hooks of the calendar pages (`app/user/[userId]/worker/calendar/page.tsx` and `buyer/calendar/page.tsx`).
- Fetch events on mount and when filters or user ID change.
- Optionally, use React Query or SWR for caching and revalidation.

---

**Summary:**
- Replace mock event logic with API calls in the calendar pages.
- Use authentication tokens for secure requests.
- Filter events client- or server-side as needed.
- Keep QA/mock mode for development. 