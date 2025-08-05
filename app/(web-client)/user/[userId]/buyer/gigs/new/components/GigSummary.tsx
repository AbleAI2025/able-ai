import React from 'react';
import { styles } from '../styles';

interface GigSummaryProps {
  data: Record<string, any>;
  expandedFields: Record<string, boolean>;
  onExpandField: (field: string) => void;
  onConfirm: () => void;
  userId: string;
}

export function GigSummary({ data, expandedFields, onExpandField, onConfirm, userId }: GigSummaryProps) {
  return (
    <div style={styles.summaryContainer}>
      <h3 style={styles.summaryHeading}>Gig Summary</h3>
      <ul style={styles.summaryList}>
        {Object.entries(data).map(([field, value]) => {
          if (field === 'gigLocation' && typeof value === 'string' && value.length > 40) {
            return (
              <li key={field} style={styles.summaryListItem}>
                <strong style={styles.summaryLabel}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                <span
                  style={{
                    ...styles.locationExpandableText,
                    maxWidth: expandedFields[field] ? '100%' : 220,
                    whiteSpace: expandedFields[field] ? 'normal' : 'nowrap',
                    overflow: 'hidden',
                    textOverflow: expandedFields[field] ? 'clip' : 'ellipsis',
                  }}
                  title={expandedFields[field] ? 'Click to collapse' : 'Click to expand'}
                  onClick={() => onExpandField(field)}
                >
                  {expandedFields[field] ? value : value.slice(0, 37) + '...'}
                </span>
              </li>
            );
          }
          return (
            <li key={field} style={styles.summaryListItem}>
              <strong style={styles.summaryLabel}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
              <span>
                {value && typeof value === 'object' && 'lat' in value && 'lng' in value
                  ? `Lat: ${value.lat}, Lng: ${value.lng}`
                  : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        style={styles.primaryButton}
        onClick={onConfirm}
      >
        Confirm & Go to Dashboard
      </button>
    </div>
  );
}
