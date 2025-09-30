import React from 'react';
import MessageBubble from '@/app/components/onboarding/MessageBubble';

type Props = {
  onClose: () => void;
  onSwitchToManual: () => void;
  onContactSupport: () => void;
  supportCaseId?: string | null;
};

const HelpMenu: React.FC<Props> = ({ onClose, onSwitchToManual, onContactSupport, supportCaseId }) => (
  <MessageBubble
    text={
      <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>🆘 Help & Support</h3>
        <p style={{ marginBottom: 16, color: '#e5e5e5' }}>
          I'm here to help you complete your profile setup. Here are your options:
        </p>
        
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fff', marginBottom: 8 }}>💡 Quick Tips:</h4>
          <ul style={{ color: '#e5e5e5', marginLeft: 16, lineHeight: 1.6 }}>
            <li>Be specific about your skills and experience</li>
            <li>Use professional language when describing yourself</li>
            <li>Answer each question as it appears</li>
            <li>If you're unsure, just describe what you do best</li>
          </ul>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fff', marginBottom: 8 }}>🛠️ Available Commands:</h4>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 6, marginBottom: 8 }}>
            <code style={{ color: '#4CAF50', fontFamily: 'monospace' }}>/help</code> - Show this help menu
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 6, marginBottom: 8 }}>
            <code style={{ color: '#4CAF50', fontFamily: 'monospace' }}>/manual</code> - Switch to manual form
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 6 }}>
            <code style={{ color: '#4CAF50', fontFamily: 'monospace' }}>/support</code> - Contact human support
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={onClose}
          >
            Continue with AI Onboarding
          </button>
          <button
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 8, padding: '12px 16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={onSwitchToManual}
          >
            Switch to Manual Form
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

export default HelpMenu;
