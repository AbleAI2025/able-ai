/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse coordinates from various location formats
 * @param location Location string or object that might contain coordinates
 * @returns Object with lat and lon, or null if not found
 */
export function parseCoordinates(location: any): { lat: number; lon: number } | null {
  if (!location) return null;

  // If location is already coordinates object
  if (typeof location === 'object' && location.lat && location.lon) {
    return { lat: location.lat, lon: location.lon };
  }

  // If location is a string, try to parse coordinates
  if (typeof location === 'string') {
    // Try to match patterns like "51.536292, -0.283669" or "lat: 51.536292, lon: -0.283669"
    const coordMatch = location.match(/(?:lat[:\s]*)?(-?\d+\.?\d*)[,\s]+(?:lon[:\s]*)?(-?\d+\.?\d*)/i);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  }

  return null;
}

/**
 * Check if a worker is within the specified distance of a gig
 * @param gigLocation Gig location (can be string, object, or coordinates)
 * @param workerLocation Worker location (can be string, object, or coordinates)
 * @param maxDistanceKm Maximum distance in kilometers (default: 30)
 * @returns True if worker is within distance, false otherwise
 */
export function isWorkerWithinDistance(
  gigLocation: any,
  workerLocation: any,
  maxDistanceKm: number = 30
): boolean {
  const gigCoords = parseCoordinates(gigLocation);
  const workerCoords = parseCoordinates(workerLocation);

  if (!gigCoords || !workerCoords) {
    // If we can't parse coordinates, assume they're within distance
    // This prevents filtering out workers when location data is incomplete
    return true;
  }

  const distance = calculateDistance(
    gigCoords.lat,
    gigCoords.lon,
    workerCoords.lat,
    workerCoords.lon
  );

  return distance <= maxDistanceKm;
}
