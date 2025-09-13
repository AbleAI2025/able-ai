import React, { useState, useCallback } from 'react';
import styles from './MapLinkBubble.module.css';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface MapLinkBubbleProps {
    id?: string;
    name?: string;
    label?: string;
    value?: { lat: number; lng: number } | null;
    onChange?: (locationData: { lat: number; lng: number } | null) => void;
    disabled?: boolean;
    googleMapsApiKey?: string;
}

const defaultCenter = { lat: 51.5074, lng: -0.1278 }; // London as default

const MapLinkBubble: React.FC<MapLinkBubbleProps> = ({
    // id,
    // name,
    label = 'Select a location on the map',
    value,
    onChange,
    disabled,
    googleMapsApiKey,
}) => {
    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(value || null);
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: googleMapsApiKey || '',
        libraries: ['places'],
    });

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarker(coords);
        if (onChange) onChange(coords);
    }, [onChange]);

    const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarker(coords);
        if (onChange) onChange(coords);
    }, [onChange]);

    // Option 1: Use current location
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMarker(coords);
                setError('');
                if (onChange) onChange(coords);
            },
            () => setError('Unable to retrieve your location.'),
            { enableHighAccuracy: true }
        );
    };

    // Option 2: Paste Google Maps URL
    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = event.target.value;
        setUrl(newUrl);
        setError('');
        if (newUrl.trim() === '') {
            if (onChange) onChange(null);
            return;
        }
        // Regex to find lat and lon from Google Maps URL
        const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const match = newUrl.match(regex);
        if (match && match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            const coords = { lat, lng };
            setMarker(coords);
            setError('');
            if (onChange) onChange(coords);
        } else {
            setError('Invalid Google Maps URL. Please paste the full URL.');
            if (onChange) onChange(null);
        }
    };

    return (
        <div className={styles.mapBubbleWrapper}>
            <div className={styles.mapBubbleContent}>
                {label && <p className={styles.label}>{label}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    <button type="button" onClick={handleUseCurrentLocation} style={{ marginBottom: 4 }}>
                        Use your current location
                    </button>
                    <input
                        type="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="Paste Google Maps URL with pin here"
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', marginBottom: 4 }}
                        disabled={disabled}
                    />
                    {error && <span style={{ color: '#d93025', fontWeight: 500 }}>{error}</span>}
                </div>
                <div className={styles.mapPlaceholder} style={{ minHeight: 250, minWidth: 250 }}>
                    {googleMapsApiKey ? (
                        isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: 250, borderRadius: 12 }}
                                center={marker || defaultCenter}
                                zoom={marker ? 15 : 10}
                                onClick={handleMapClick}
                                options={{ disableDefaultUI: true }}
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
                            <span>Loading map...</span>
                        )
                    ) : (
                        <span style={{ color: '#d93025', fontWeight: 500 }}>
                            Google Maps API key not set. Please add your key to enable map selection.
                        </span>
                    )}
                </div>
                {marker && (
                    <div className={styles.selectedLocation}>
                        <strong>Selected:</strong> {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapLinkBubble;