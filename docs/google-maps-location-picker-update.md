# Google Maps API Integration for Location Picker

## Overview
Updated the location picker components to use Google Maps API for enhanced location selection functionality in both worker onboarding and buyer gig creation flows.

## Changes Made

### 1. Updated Shared LocationPickerBubble Component
**File:** `app/components/onboarding/LocationPickerBubble.tsx`

**Key Features Added:**
- Google Maps API integration with `@react-google-maps/api`
- Address autocomplete with Google Places API
- Interactive map with click-to-select functionality
- Draggable markers
- Reverse geocoding to get addresses from coordinates
- Current location detection
- Search functionality with geocoding
- Dark theme styling for better UX

**New Functionality:**
- **Search Input**: Users can search for locations by typing addresses or place names
- **Autocomplete**: Google Places API provides real-time suggestions as users type
- **Interactive Map**: Click anywhere on the map to select a location
- **Draggable Marker**: Users can drag the marker to fine-tune location selection
- **Current Location**: One-click button to use device's current location
- **Reverse Geocoding**: Automatically converts coordinates to human-readable addresses

### 2. Updated Buyer-Specific LocationPickerBubble Component
**File:** `app/(web-client)/user/[userId]/buyer/gigs/new/components/LocationPickerBubble.tsx`

**Changes:**
- Updated to use Google Maps API with the same functionality as the shared component
- Maintains buyer-specific styling and behavior
- Enhanced with interactive map and search capabilities

### 3. Updated CSS Styles
**File:** `app/(web-client)/user/[userId]/buyer/gigs/new/components/LocationPickerBubble.module.css`

**New Styles Added:**
- Search container and input styling
- Map container with proper dimensions
- Selected location display styling
- Responsive design for mobile devices
- Google Places autocomplete styling (dark theme)

### 4. Dependencies Added
- `@types/google.maps` - TypeScript definitions for Google Maps API

## API Key Configuration
The Google Maps API key is configured as a constant in both components:
```typescript
const GOOGLE_MAPS_API_KEY = '';
```

## Features

### For Users:
1. **Easy Location Search**: Type any address or place name to find it
2. **Visual Map Selection**: Click directly on the map to select locations
3. **Current Location**: Use device GPS for instant location detection
4. **Address Validation**: Automatic address formatting and validation
5. **Mobile Friendly**: Responsive design works on all devices

### For Developers:
1. **Type Safety**: Full TypeScript support with proper type definitions
2. **Consistent API**: Same interface across all location picker components
3. **Error Handling**: Comprehensive error handling for API failures
4. **Performance**: Optimized loading and rendering
5. **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

### In Worker Onboarding:
```tsx
<LocationPickerBubble
  value={formData.location}
  onChange={val => handleInputChange('location', val)}
  showConfirm={false}
  onConfirm={() => handlePickerConfirm(step.id, 'location')}
  role="GIG_WORKER"
/>
```

### In Buyer Gig Creation:
```tsx
<LocationPickerBubble
  value={formData.gigLocation}
  onChange={val => onInputChange('gigLocation', val)}
  showConfirm={!!formData.gigLocation && isActive}
  onConfirm={() => onInputSubmit(step.id, 'gigLocation')}
  role="BUYER"
/>
```

## Data Structure
The location picker now returns objects with the following structure:
```typescript
{
  lat: number;
  lng: number;
  formatted_address: string;
}
```

This provides both precise coordinates for backend storage and human-readable addresses for display.

## Browser Compatibility
- Modern browsers with geolocation support
- Requires HTTPS for geolocation functionality
- Graceful fallback for unsupported features

## Performance Considerations
- Google Maps API is loaded only when needed
- Autocomplete suggestions are debounced
- Map rendering is optimized for mobile devices
- Error states are handled gracefully

## Future Enhancements
1. **Caching**: Cache frequently used locations
2. **Offline Support**: Basic offline functionality
3. **Custom Styling**: More map style options
4. **Batch Geocoding**: Handle multiple locations efficiently
5. **Analytics**: Track location selection patterns
