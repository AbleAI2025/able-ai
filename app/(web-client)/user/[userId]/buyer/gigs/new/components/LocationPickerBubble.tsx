"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import styles from './LocationPickerBubble.module.css';

interface LocationPickerBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  value: any;
  onChange: (value: any) => void;
  onConfirm?: () => Promise<void>;
  disabled?: boolean;
  showConfirm?: boolean;
  googleMapsApiKey?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyAu25FZGBoAn-l1hhirCNfnmMwO_qfJvhg';

const defaultCenter = { lat: 51.5074, lng: -0.1278 }; // London as default

const LocationPickerBubble: React.FC<LocationPickerBubbleProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  showConfirm,
  googleMapsApiKey = GOOGLE_MAPS_API_KEY
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
    libraries: ['places'],
  });

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
    if (disabled) return;
    
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { lat, lng };
          
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
        () => setError('Unable to get your current location')
      );
    } else {
      setError('Geolocation is not supported by your browser');
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
    if (!searchInput.trim() || disabled) return;
    
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

  const handleSubmit = () => {
    if (!disabled && marker) {
      setIsEditing(false);
      setError('');
    }
  };

  return (
    <div className={styles.locationBubbleWrapper}>
      {label && <label htmlFor={id || name} className={styles.label}>{label}</label>}
      <div className={styles.locationInputContainer}>
        {isEditing ? (
          <div className={styles.inputWrapper}>
            <style>{`
              .pac-container {
                background: #333 !important;
                border: 1px solid #555 !important;
                border-radius: 8px !important;
                z-index: 1000 !important;
              }
              .pac-item {
                color: #fff !important;
                border-bottom: 1px solid #555 !important;
                padding: 8px 12px !important;
                font-size: 14px !important;
              }
              .pac-item:hover {
                background: #444 !important;
                color: #fff !important;
              }
              .pac-item-selected {
                background: var(--secondary-color) !important;
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

            {/* Search Input */}
            <div className={styles.searchContainer}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a location or address..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.searchInput}
                disabled={disabled}
              />
              <button
                onClick={handleSearchSubmit}
                disabled={isSearching || disabled}
                className={styles.searchButton}
                type="button"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Use Current Location Button */}
            <button
              onClick={handleUseCurrentLocation}
              className={styles.currentLocationButton}
              disabled={disabled}
              type="button"
            >
              Use Current Location
            </button>

            {/* Google Map */}
            <div className={styles.mapContainer}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '8px' }}
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
                <div className={styles.mapLoading}>
                  Loading map...
                </div>
              )}
            </div>

            {/* Selected Location Display */}
            {formattedAddress && (
              <div className={styles.selectedLocation}>
                <div className={styles.locationLabel}>Selected Location:</div>
                <div className={styles.locationAddress}>{formattedAddress}</div>
                {marker && (
                  <div className={styles.locationCoords}>
                    Coordinates: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}

            <div className={styles.locationActions}>
              <button
                onClick={() => setIsEditing(false)}
                className={styles.cancelButton}
                disabled={disabled}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={styles.confirmButton}
                disabled={disabled || !marker}
                type="button"
              >
                Confirm
              </button>
            </div>
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        ) : (
          <div 
            className={styles.displayAddress} 
            onClick={() => !disabled && setIsEditing(true)}
          >
            {formattedAddress || (typeof value === 'object' && value?.formatted_address) || "Click to set location"}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerBubble;
