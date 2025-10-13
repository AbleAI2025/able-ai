import React from 'react';
import Image from 'next/image';

export const BotAvatar: React.FC = () => (
  <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Image src="/images/ableai.png" alt="Able AI" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
      </div>
    </div>
  </div>
);

export const BotAvatarSpacer: React.FC = () => (
  <div style={{ flexShrink: 0, width: '32px' }}></div>
);


