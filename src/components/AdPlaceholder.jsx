import React from 'react';

const AdPlaceholder = ({ type = 'banner' }) => {
  const isBanner = type === 'banner';
  return (
    <div className="ad-container" style={{ minHeight: isBanner ? '90px' : '250px' }}>
      <div>
        <strong>Advertisement Space</strong>
        <br />
        <span style={{ fontSize: '0.8rem' }}>{isBanner ? 'Banner Ad (728x90)' : 'Responsive / Interstitial Ad'}</span>
      </div>
    </div>
  );
};

export default AdPlaceholder;
