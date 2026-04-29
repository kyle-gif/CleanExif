import React, { useState } from 'react';
import piexif from 'piexifjs';
import { Download, Sparkles, Trash2 } from 'lucide-react';
import AdModal from './AdModal';
import './CleanExifView.css';

const CleanExifView = ({ file, onClearFile }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'clean' or 'leica'

  const processImage = (action) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      
      try {
        let newDataUrl;
        if (action === 'clean') {
          // Remove all Exif
          newDataUrl = piexif.remove(dataUrl);
        } else if (action === 'leica') {
          // Remove existing and inject Leica
          const cleanDataUrl = piexif.remove(dataUrl);
          const zerothIfd = {};
          zerothIfd[piexif.ImageIFD.Make] = "Leica Camera AG";
          zerothIfd[piexif.ImageIFD.Model] = "LEICA M11";
          const exifObj = { "0th": zerothIfd, "Exif": {}, "GPS": {} };
          const exifBytes = piexif.dump(exifObj);
          newDataUrl = piexif.insert(exifBytes, cleanDataUrl);
        }

        // Trigger download
        const link = document.createElement('a');
        link.href = newDataUrl;
        link.download = `cleanexif_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } catch (err) {
        console.error("Error processing EXIF:", err);
        alert("Failed to process image. Ensure it is a valid JPEG.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleActionClick = (action) => {
    setPendingAction(action);
    setModalOpen(true);
  };

  const handleReward = () => {
    if (pendingAction) {
      processImage(pendingAction);
    }
  };

  if (!file) return null;

  const isJpeg = file && (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg'));

  return (
    <div className="clean-view-container glass-panel">
      <div className="image-preview">
        <img src={URL.createObjectURL(file)} alt="Preview" />
        <div className="file-info">
          <span>{file.name}</span>
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      {!isJpeg && (
        <div style={{ background: 'rgba(255, 59, 48, 0.1)', padding: '16px', borderRadius: '8px', color: '#ff3b30', textAlign: 'center', marginBottom: '8px' }}>
          <strong>Notice:</strong> Cleaning EXIF is currently only supported for JPEG files. 
          To prevent corruption of your RAW image ({file.name.split('.').pop().toUpperCase()}), this feature is disabled. You can still use the <strong>View Exif</strong> tab.
        </div>
      )}

      <div className="actions-panel">
        <button className="btn" onClick={() => handleActionClick('clean')} disabled={!isJpeg}>
          <Trash2 size={18} />
          Clean EXIF & Download
        </button>
        <button className="btn btn-premium" onClick={() => handleActionClick('leica')} disabled={!isJpeg}>
          <Sparkles size={18} />
          Inject Leica Vibe
        </button>
      </div>

      <button className="btn btn-outline reset-btn" onClick={onClearFile}>
        Upload Different Photo
      </button>

      <AdModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onReward={handleReward}
        title={pendingAction === 'leica' ? 'Unlock Leica Vibe' : 'Download Cleaned Image'}
        description="Watch a short ad to support our free privacy tool."
      />
    </div>
  );
};

export default CleanExifView;
