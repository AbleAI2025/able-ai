# Gig Location Display Update

## Overview
Updated the gig location display to show human-readable formatted addresses instead of coordinates in gig summaries, while preserving coordinates for distance calculations.

## Changes Made

### 1. Created Location Utilities
**File:** `utils/locationUtils.ts`

**New Functions:**
- `calculateDistance()` - Calculate distance between two coordinates using Haversine formula
- `isWorkerWithinDistance()` - Check if worker is within specified distance (default: 30km)
- `formatDistance()` - Format distance for display (e.g., "2.5km", "800m")
- `getFormattedAddress()` - Extract formatted address from location object
- `getCoordinates()` - Extract coordinates from location object

### 2. Updated Gig Summary Components

#### Shared ChatStepRenderer
**File:** `app/components/onboarding/ChatStepRenderer.tsx`

**Changes:**
- Updated gig location display to show `formatted_address` instead of coordinates
- Fallback to coordinates if formatted address is not available
- Improved display format: "Bridgwater, Somerset, UK" instead of "Lat: 51.1234, Lng: -2.5678"

#### Buyer-Specific GigSummary
**File:** `app/(web-client)/user/[userId]/buyer/gigs/new/components/GigSummary.tsx`

**Changes:**
- Updated to display `formatted_address` for location objects
- Maintains fallback to coordinates if formatted address is unavailable

#### Buyer Gig Creation Page
**File:** `app/(web-client)/user/[userId]/buyer/gigs/new/page.tsx`

**Changes:**
- Updated gig summary display to show formatted addresses
- Fixed TypeScript typing issues with location objects

### 3. Database Schema Support
The existing database schema already supports this functionality:

- **`exactLocation`** (text) - Stores the human-readable formatted address
- **`addressJson`** (jsonb) - Stores the full location object including coordinates

### 4. Gig Creation Process
The `createGig` action already properly handles location data:

- Extracts `formatted_address` for display in `exactLocation`
- Preserves full location object with coordinates in `addressJson`
- Maintains backward compatibility with existing data

## Features

### For Users:
1. **Readable Addresses**: Gig summaries now show "Bridgwater, Somerset, UK" instead of coordinates
2. **Better UX**: Human-readable locations make gigs easier to understand
3. **Consistent Display**: All gig summaries show formatted addresses

### For Developers:
1. **Distance Calculations**: Utilities available for 30km radius calculations
2. **Coordinate Preservation**: Full coordinate data still available for calculations
3. **Type Safety**: Proper TypeScript support for location objects
4. **Fallback Support**: Graceful handling when formatted address is unavailable

## Distance Calculation Implementation

### 30km Radius Logic:
```typescript
import { isWorkerWithinDistance } from '@/utils/locationUtils';

// Check if worker can accept gig (within 30km)
const canAcceptGig = isWorkerWithinDistance(
  workerLat, 
  workerLng, 
  gigLat, 
  gigLng, 
  30 // 30km radius
);
```

### Usage Examples:
```typescript
// Calculate distance between two points
const distance = calculateDistance(lat1, lng1, lat2, lng2);

// Format distance for display
const displayDistance = formatDistance(distance); // "2.5km" or "800m"

// Get formatted address from location object
const address = getFormattedAddress(locationObject);

// Extract coordinates for calculations
const coords = getCoordinates(locationObject);
```

## Data Structure

### Location Object Structure:
```typescript
{
  lat: number;
  lng: number;
  formatted_address: string; // Human-readable address
  address?: string; // Alternative address field
  // ... other Google Maps API fields
}
```

### Database Storage:
- **`exactLocation`**: "Bridgwater, Somerset, UK"
- **`addressJson`**: Full location object with coordinates

## Benefits

1. **User Experience**: Gig summaries are now much more readable
2. **Distance Filtering**: Ready for 30km radius worker-gig matching
3. **Data Integrity**: Coordinates preserved for precise calculations
4. **Backward Compatibility**: Existing data continues to work
5. **Future-Proof**: Utilities available for advanced location features

## Next Steps

1. **Worker-Gig Matching**: Implement 30km radius filtering in gig search
2. **Distance Display**: Show distance between worker and gig locations
3. **Location Validation**: Ensure all gigs have proper formatted addresses
4. **Performance**: Optimize distance calculations for large datasets
