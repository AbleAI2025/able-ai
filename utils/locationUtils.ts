/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

/**
 * Check if a worker is within the specified distance of a gig location
 * @param workerLat Worker's latitude
 * @param workerLng Worker's longitude
 * @param gigLat Gig's latitude
 * @param gigLng Gig's longitude
 * @param maxDistance Maximum distance in kilometers (default: 30)
 * @returns True if worker is within the specified distance
 */
export function isWorkerWithinDistance(
  workerLat: number,
  workerLng: number,
  gigLat: number,
  gigLng: number,
  maxDistance: number = 30
): boolean {
  const distance = calculateDistance(workerLat, workerLng, gigLat, gigLng);
  return distance <= maxDistance;
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Extract formatted address from location object
 * @param location Location object or string
 * @returns Formatted address string
 */
export function getFormattedAddress(location: any): string {
  if (!location) return 'Location not specified';
  
  if (typeof location === 'string') {
    return location;
  }
  
  if (typeof location === 'object') {
    // Priority order for display
    if (location.formatted_address) {
      return location.formatted_address;
    }
    if (location.address) {
      return location.address;
    }
    if (location.lat && location.lng) {
      return `Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    // Try to build from components
    const parts = [];
    if (location.street_number) parts.push(location.street_number);
    if (location.route) parts.push(location.route);
    if (location.locality) parts.push(location.locality);
    if (location.administrative_area_level_1) parts.push(location.administrative_area_level_1);
    if (location.postal_code) parts.push(location.postal_code);
    if (location.country) parts.push(location.country);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  return 'Location details available';
}

/**
 * Extract coordinates from location object
 * @param location Location object or string
 * @returns Object with lat and lng, or null if not available
 */
export function getCoordinates(location: any): { lat: number; lng: number } | null {
  if (!location) return null;
  
  if (typeof location === 'object') {
    if (location.lat && location.lng && 
        typeof location.lat === 'number' && typeof location.lng === 'number') {
      return { lat: location.lat, lng: location.lng };
    }
  }
  
  // Try to parse coordinates from string (format: "lat, lng")
  if (typeof location === 'string') {
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  
  return null;
}
