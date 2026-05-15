import React, { useEffect } from 'react';

const AdPlaceholder = ({ type = 'banner', className = '', adSlot = '5890620537' }) => {
  const isBanner = type === 'banner';

  useEffect(() => {
    // Only attempt to push ad if running in production/browser with adsbygoogle defined
    try {
      if (window.adsbygoogle && !import.meta.env.DEV) {
         (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden flex flex-col items-center justify-center relative ${isBanner ? 'min-h-[90px]' : 'min-h-[250px]'} ${className}`}>
      
      {/* Fallback visual for Development Environment */}
      {import.meta.env.DEV && (
        <div className="absolute inset-0 bg-leica-darkgray border border-leica-gray flex flex-col items-center justify-center text-leica-lightgray z-10">
          <strong className="text-white">AdSense Space</strong>
          <span className="text-xs text-gray-500 mt-1">{isBanner ? 'Banner Ad (Auto)' : 'Responsive Ad (Auto)'}</span>
        </div>
      )}

      {/* Actual AdSense Unit */}
      <ins className="adsbygoogle w-full"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-5875312268141521"
           data-ad-slot={adSlot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdPlaceholder;
