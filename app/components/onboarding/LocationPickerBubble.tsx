import React, { useState, useRef, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

// FontAwesome icons (assume global or imported elsewhere)
// fa-location-dot, fa-map-location-dot, fa-building

interface LocationPickerBubbleProps {
  value?: any;
  onChange: (value: any) => void;
  showConfirm?: boolean;
  onConfirm?: (address: string,coord: {lat: number, lng: number}) => void;
  role?: 'BUYER' | 'GIG_WORKER';
  googleMapsApiKey?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyAu25FZGBoAn-l1hhirCNfnmMwO_qfJvhg';

const defaultCenter = { lat: 51.5074, lng: -0.1278 }; // London as default

const LocationPickerBubble: React.FC<LocationPickerBubbleProps> = ({ 
  value, 
  onChange, 
  showConfirm, 
  onConfirm, 
  role = 'GIG_WORKER',
  googleMapsApiKey = GOOGLE_MAPS_API_KEY
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
    libraries: ['places'],
  });

  // Get colors based on role
  const getColors = () => {
    if (role === 'BUYER') {
      return {
        primary: 'var(--secondary-color)',
        primaryDarker: 'var(--secondary-darker-color)',
        accent: '#0f766e'
      };
    } else {
      return {
        primary: 'var(--primary-color)',
        primaryDarker: 'var(--primary-darker-color)',
        accent: '#0f766e'
      };
    }
  };

  const colors = getColors();

  // Initialize autocomplete when component loads
  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'GB' }, // Restrict to UK
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const coords = { lat, lng };
          
          // Fill the search input with the complete formatted address
          const fullAddress = place.formatted_address || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSearchInput(fullAddress);
          setMarker(coords);
          setFormattedAddress(fullAddress);
          setError('');
          
          // Pass coordinates as an object to preserve lat/lng for backend storage
          onChange({ 
            lat, 
            lng, 
            formatted_address: fullAddress
          });
        }
      });
    }
  }, [isLoaded, onChange]);

  // Initialize with existing value
  useEffect(() => {
    if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) {
      setMarker({ lat: value.lat, lng: value.lng });
      setFormattedAddress(value.formatted_address || `Coordinates: ${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`);
    }
  }, [value]);

  const handleUseCurrentLocation = () => {
    
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log(formattedAddress);
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { lat, lng };
          console.log(coords);

          
          setMarker(coords);
          
          // Get address from coordinates using reverse geocoding
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: coords });
            const address = result.results[0]?.formatted_address || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setFormattedAddress(address);
            
            onChange({ lat, lng, formatted_address: address });
          } catch (err) {
            const address = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setFormattedAddress(address);
            onChange({ lat, lng, formatted_address: address });
          }
        },
        () => setError('Unable to get your location.')
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const coords = { lat, lng };
    
    setMarker(coords);
    
    // Get address from coordinates using reverse geocoding
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        setFormattedAddress(address);
        onChange({ lat, lng, formatted_address: address });
      } else {
        const address = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setFormattedAddress(address);
        onChange({ lat, lng, formatted_address: address });
      }
    });
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const coords = { lat, lng };
    
    setMarker(coords);
    
    // Get address from coordinates using reverse geocoding
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        setFormattedAddress(address);
        onChange({ lat, lng, formatted_address: address });
      } else {
        const address = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setFormattedAddress(address);
        onChange({ lat, lng, formatted_address: address });
      }
    });
  };

  const handleSearchSubmit = async () => {
    if (!searchInput.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchInput });
      
      if (result.results && result.results[0]) {
        const place = result.results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const coords = { lat, lng };
        
        setMarker(coords);
        setFormattedAddress(place.formatted_address);
        onChange({ lat, lng, formatted_address: place.formatted_address });
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) {
      setError('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <div style={{ background: '#232323', borderRadius: 12, padding: 16, margin: '12px 0', boxShadow: '0 2px 8px #0002', maxWidth: 500 }}>
      <style>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .pac-container {
          background: #333 !important;
          border: 1px solid #555 !important;
          border-radius: 8px !important;
        }
        .pac-item {
          color: #fff !important;
          border-bottom: 1px solid #555 !important;
          padding: 8px 12px !important;
        }
        .pac-item:hover {
          background: #444 !important;
        }
        .pac-item-selected {
          background: ${colors.primary} !important;
          color: #fff !important;
        }
        .pac-item-query {
          color: #fff !important;
          font-weight: 600 !important;
        }
        .pac-matched {
          color: #fff !important;
          font-weight: 600 !important;
        }
      `}</style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location or address..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ 
              flex: 1, 
              background: '#333', 
              border: '1px solid #555', 
              color: '#fff', 
              fontSize: 15, 
              outline: 'none',
              padding: '10px 12px',
              borderRadius: '8px'
            }}
          />
          <button
            onClick={handleSearchSubmit}
            disabled={isSearching}
            style={{
              background: colors.primary,
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              color: '#000',
              minWidth: '80px'
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Use Current Location Button */}
        <button
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: colors.primary, 
            border: 'none', 
            borderRadius: 8, 
            padding: '10px 12px', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: 16,
            color: '#000'
          }}
          onClick={handleUseCurrentLocation}
        >
          <i className="fa-solid fa-location-dot" style={{ fontSize: 18 }} />
          Use my current location
        </button>

        {/* Google Map */}
        <div style={{ height: 300, borderRadius: 8, overflow: 'hidden', border: '1px solid #555' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={marker || defaultCenter}
              zoom={marker ? 15 : 10}
              onClick={handleMapClick}
              options={{ 
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                styles: [
                  {
                    featureType: 'all',
                    elementType: 'all',
                    stylers: [
                      { invert_lightness: true },
                      { saturation: 10 },
                      { lightness: 30 },
                      { gamma: 0.5 },
                      { hue: '#0077ff' }
                    ]
                  }
                ]
              }}
            >
              {marker && (
                <Marker
                  position={marker}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </GoogleMap>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              background: '#333',
              color: '#fff'
            }}>
              Loading map...
            </div>
          )}
        </div>

        {error && <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
        
        {formattedAddress && (
          <div style={{ 
            background: '#333', 
            padding: '12px', 
            borderRadius: 8, 
            border: '1px solid #555'
          }}>
            <div style={{ color: colors.primary, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Selected Location:
            </div>
            <div style={{ color: '#fff', fontSize: 15 }}>
              {formattedAddress}
            </div>
          </div>
        )}
        
        {showConfirm && marker && onConfirm && (
          <button
            style={{
              background: colors.primary, 
              border: 'none', 
              borderRadius: 8, 
              padding: '12px 16px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              fontSize: 16,
              color: '#fff',
              marginTop: 8
            }}
            onClick={() => onConfirm(formattedAddress, marker)}
          >
            Confirm Location
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationPickerBubble; 