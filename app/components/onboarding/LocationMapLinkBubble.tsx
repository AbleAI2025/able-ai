import React from 'react';
import styles from './LocationMapLinkBubble.module.css';
import { MapPin, ExternalLink } from 'lucide-react';
// import InputBubble from './InputBubble'; // If using InputBubble internally

interface LocationMapLinkBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  mapUrl?: string;
  linkText?: string;
  locationText?: string;
  disabled?: boolean;
  // Props for potential future input integration
  // value?: string;
  // onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  // placeholder?: string;
}

const LocationMapLinkBubble = React.forwardRef<HTMLDivElement, LocationMapLinkBubbleProps>( // Ref could be for a wrapper or a specific input if added
  ({
    label = "Location",
    mapUrl,
    linkText = "View on Map",
    locationText,
    disabled,
    // value,
    // onChange,
    // placeholder,
  }, ref) => {
    // const inputId = id || name; // For internal input if used

    return (
      <div className={`${styles.locationBubbleWrapper} ${styles.alignUser}`} ref={ref}>
        <div className={styles.locationBubbleContent}>
          {label && <p className={styles.label}>{label}</p>}

          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.mapLink} ${disabled ? styles.disabledLink : ''}`}
              onClick={(e) => disabled && e.preventDefault()}
            >
              <MapPin size={16} />
              <span>{linkText}</span>
              <ExternalLink size={14} className={styles.externalIcon}/>
            </a>
          ) : locationText ? (
            <div className={styles.locationTextDisplay}>
              <MapPin size={16} />
              <span>{locationText}</span>
            </div>
          ) : (
            <div className={styles.locationPlaceholder}>
              <MapPin size={16} />
              <span>Location details will appear here or become interactive.</span>
              {/* 
              // Example for future InputBubble integration:
              <InputBubble
                id={inputId}
                name={name}
                type="text"
                placeholder={placeholder || "Enter location"}
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                // ref={inputSpecificRef} // if InputBubble accepts ref
              />
              */}
            </div>
          )}
        </div>
      </div>
    );
  }
);

LocationMapLinkBubble.displayName = 'LocationMapLinkBubble';
export default LocationMapLinkBubble;