import React from 'react';

const IncidentBanner: React.FC = () => (
  <div style={{ 
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)', 
    color: 'white', 
    padding: '12px 16px', 
    margin: '8px 0', 
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
  }}>
    <div style={{ 
      width: '8px', 
      height: '8px', 
      borderRadius: '50%', 
      background: 'white',
      animation: 'pulse 1.5s infinite'
    }}></div>
    <span>🚨 Incident Reporting Mode - Please provide details about the incident</span>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

export default IncidentBanner;


