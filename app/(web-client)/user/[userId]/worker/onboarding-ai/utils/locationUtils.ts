export interface ParsedLocationData {
  parsedLocation: any;
  humanReadableLocation: string;
  databaseLocation?: {
    location?: string;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Parse location data that may be a JSON string or object
 * Returns structured data for different use cases
 */
export function parseLocationData(rawLocation: string | object | undefined): ParsedLocationData {
  let parsedLocation: any = null;

  // Parse string input
  if (typeof rawLocation === 'string') {
    try {
      parsedLocation = rawLocation ? JSON.parse(rawLocation) : null;
    } catch (e) {
      parsedLocation = null;
    }
  } else if (rawLocation && typeof rawLocation === 'object') {
    parsedLocation = rawLocation;
  }

  // Generate human-readable location string
  let humanReadableLocation = 'Not provided';
  if (parsedLocation) {
    if (parsedLocation.formatted_address) {
      humanReadableLocation = parsedLocation.formatted_address;
    } else if (parsedLocation.address) {
      humanReadableLocation = parsedLocation.address;
    } else if (parsedLocation.lat !== undefined && parsedLocation.lng !== undefined) {
      humanReadableLocation = `${parsedLocation.lat}, ${parsedLocation.lng}`;
    } else {
      try {
        humanReadableLocation = JSON.stringify(parsedLocation);
      } catch {
        humanReadableLocation = 'Not provided';
      }
    }
  } else if (typeof rawLocation === 'string' && rawLocation.trim() !== '') {
    humanReadableLocation = rawLocation;
  }

  // Generate database-ready location data
  const databaseLocation = parsedLocation &&
    (parsedLocation.formatted_address || parsedLocation.lat !== undefined || parsedLocation.lng !== undefined) ? {
      location: parsedLocation.formatted_address || undefined,
      latitude: parsedLocation.lat !== undefined ? parsedLocation.lat : undefined,
      longitude: parsedLocation.lng !== undefined ? parsedLocation.lng : undefined,
    } : undefined;

  return {
    parsedLocation,
    humanReadableLocation,
    databaseLocation
  };
}