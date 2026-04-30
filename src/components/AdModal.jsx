import React from 'react';

const AdModal = ({ isOpen, onClose, onReward, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-leica-darkgray border border-leica-gray w-full max-w-md p-6 rounded-lg shadow-2xl flex flex-col gap-4 animate-[fadeIn_0.2s_ease-out]">
        <h2 className="text-xl font-bold text-white">{title || 'Watch an Ad to Unlock'}</h2>
        <p className="text-sm text-leica-lightgray">{description || 'Support us by watching a short advertisement to unlock premium features or download your file.'}</p>
        
        <div className="bg-black text-white h-[200px] flex items-center justify-center rounded border border-gray-800">
          <p className="font-medium text-gray-500">🎬 Video Advertisement Playing...</p>
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            onReward();
            onClose();
          }}>Skip & Proceed</button>
        </div>
      </div>
    </div>
  );
};

export default AdModal;
