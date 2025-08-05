import React, { useState } from 'react';

// FontAwesome icons (assume global or imported elsewhere)
// fa-location-dot, fa-map-location-dot, fa-building

interface LocationPickerBubbleProps {
  value?: any;
  onChange: (value: any) => void;
  showConfirm?: boolean;
  onConfirm?: () => void;
}

function extractCoordsFromGoogleMapsUrl(url: string) {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

const LocationPickerBubble: React.FC<LocationPickerBubbleProps> = ({ value, onChange, showConfirm, onConfirm }) => {
  const [urlInput, setUrlInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'geo' | 'url' | 'address' | null>(null);

  const handleGeo = () => {
    setError('');
    setSelectedMethod('geo');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onChange(coords);
      }, () => setError('Unable to get your location.'));
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleUrlBlur = () => {
    setSelectedMethod('url');
    const coords = extractCoordsFromGoogleMapsUrl(urlInput);
    if (coords) {
      setError('');
      onChange(coords);
    } else if (urlInput) {
      setError('Could not extract coordinates from this URL.');
    }
  };

  const handleAddressBlur = () => {
    setSelectedMethod('address');
    if (addressInput) {
      setError('');
      onChange(addressInput);
    }
  };

  return (
    <div style={{ background: '#232323', borderRadius: 12, padding: 16, margin: '12px 0', boxShadow: '0 2px 8px #0002', maxWidth: 400 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: selectedMethod === 'geo' ? '#0f766e' : '#18181b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 16
          }}
          onClick={handleGeo}
        >
          <i className="fa-solid fa-location-dot" style={{ color: '#0f766e', fontSize: 20 }} />
          Use my current location
        </button>
        <div style={{ display: 'flex', alignItems: 'center', background: selectedMethod === 'url' ? '#0f766e' : '#18181b', borderRadius: 8, padding: '4px 8px' }}>
          <i className="fa-solid fa-map-location-dot" style={{ color: '#0f766e', fontSize: 18, marginRight: 8 }} />
          <input
            type="text"
            placeholder="Paste Google Maps URL"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onBlur={handleUrlBlur}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: selectedMethod === 'address' ? '#0f766e' : '#18181b', borderRadius: 8, padding: '4px 8px' }}>
          <i className="fa-solid fa-building" style={{ color: '#0f766e', fontSize: 18, marginRight: 8 }} />
          <input
            type="text"
            placeholder="Enter address manually"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            onBlur={handleAddressBlur}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none' }}
          />
        </div>
        {error && <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
        {value && (
          <div style={{ color: '#0f766e', fontSize: 15, marginTop: 8 }}>
            Selected: {typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value && typeof value.lat === 'number' && typeof value.lng === 'number' 
              ? `Lat: ${value.lat.toFixed(6)}, Lng: ${value.lng.toFixed(6)}` 
              : String(value)}
          </div>
        )}
        {showConfirm && value && onConfirm && (
          <button
            style={{
              background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginTop: 8
            }}
            onClick={onConfirm}
          >
            Confirm Location
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationPickerBubble; 