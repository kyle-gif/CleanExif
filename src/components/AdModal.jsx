import React from 'react';
import './AdModal.css';

const AdModal = ({ isOpen, onClose, onReward, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <h2>{title || 'Watch an Ad to Unlock'}</h2>
        <p>{description || 'Support us by watching a short advertisement to unlock premium features or download your file.'}</p>
        
        <div className="ad-video-placeholder">
          <p>🎬 Video Advertisement Playing...</p>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => {
            onReward();
            onClose();
          }}>Skip & Proceed</button>
        </div>
      </div>
    </div>
  );
};

export default AdModal;
