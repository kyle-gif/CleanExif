import React from 'react';

const AdPlaceholder = ({ type = 'banner', className = '' }) => {
  const isBanner = type === 'banner';
  return (
    <div className={`w-full bg-leica-darkgray border border-leica-gray flex flex-col items-center justify-center text-leica-lightgray text-sm overflow-hidden relative ${isBanner ? 'min-h-[90px]' : 'min-h-[250px]'} ${className}`}>
      <strong className="text-white">Advertisement Space</strong>
      <span className="text-xs text-gray-500 mt-1">{isBanner ? 'Banner Ad (728x90)' : 'Responsive / Interstitial Ad'}</span>
      <div className="absolute top-1 right-2 text-[10px] text-gray-600">AdSense</div>
    </div>
  );
};

export default AdPlaceholder;
