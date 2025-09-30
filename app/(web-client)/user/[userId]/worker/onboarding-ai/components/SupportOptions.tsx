import React from 'react';
import MessageBubble from '@/app/components/onboarding/MessageBubble';

type Props = {
  onSwitchToManual: () => void;
  onContactSupport: () => void;
  supportCaseId?: string | null;
};

const SupportOptions: React.FC<Props> = ({ onSwitchToManual, onContactSupport, supportCaseId }) => (
  <MessageBubble
    text={
      <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Need Human Support?</h3>
        <p style={{ marginBottom: 16, color: '#e5e5e5' }}>
          I understand you're having trouble with the AI onboarding. Here are your options:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={onSwitchToManual}
          >
            Switch to Manual Form Input
          </button>
          <button
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 8, padding: '12px 16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={onContactSupport}
          >
            Contact Support Team
          </button>
        </div>
        {supportCaseId && (
          <p style={{ marginTop: 16, fontSize: '14px', color: '#ccc', fontStyle: 'italic' }}>
            Support Case ID: {supportCaseId}
          </p>
        )}
      </div>
    }
    senderType="bot"
  />
);

export default SupportOptions;


