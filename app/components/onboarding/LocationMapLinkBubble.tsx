import React, { useState, ChangeEvent } from 'react';
import styles from './LocationMapLinkBubble.module.css';
import { MapPin } from 'lucide-react';

interface LocationMapLinkBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  onLocationSet?: (coords: { lat: number; lon: number } | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const LocationMapLinkBubble = React.forwardRef<HTMLInputElement, LocationMapLinkBubbleProps>(
  ({
    id,
    name,
    label = "Paste your Google Maps link here",
    onLocationSet,
    disabled,
    placeholder = "e.g., https://www.google.com/maps/@..."
  }, ref) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const inputId = id || name || 'location-map-link';

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newUrl = event.target.value;
      setUrl(newUrl);
      setError(''); // Clear error on new input

      if (newUrl.trim() === '') {
        if (onLocationSet) {
          onLocationSet(null);
        }
        return;
      }

      // Regex to find lat and lon from Google Maps URL
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = newUrl.match(regex);

      if (match && match[1] && match[2]) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (onLocationSet) {
          onLocationSet({ lat, lon });
        }
      } else {
        setError('Invalid Google Maps URL. Please paste the full URL.');
        if (onLocationSet) {
          onLocationSet(null);
        }
      }
    };

    return (
      <div className={`${styles.locationBubbleWrapper} ${styles.alignUser}`}>
        <div className={styles.locationBubbleContent}>
          {label && <p className={styles.label}>{label}</p>}
          <div className={styles.inputWrapper}>
            <MapPin size={18} className={styles.inputIcon} />
            <input
              id={inputId}
              name={name}
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder={placeholder}
              disabled={disabled}
              className={styles.locationInput}
              ref={ref}
            />
          </div>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      </div>
    );
  }
);

LocationMapLinkBubble.displayName = 'LocationMapLinkBubble';
export default LocationMapLinkBubble;