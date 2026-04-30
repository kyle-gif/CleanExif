import React, { useState } from 'react';
import piexif from 'piexifjs';
import { Download, Sparkles, Trash2 } from 'lucide-react';
import AdModal from './AdModal';

const CleanExifView = ({ file, onClearFile }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const processImage = (action) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      try {
        let newDataUrl = piexif.remove(dataUrl);
        const link = document.createElement('a');
        link.href = newDataUrl;
        link.download = `clean_${file.name}`;
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

  if (!file) return null;
  const isJpeg = file && (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg'));

  return (
    <div className="panel flex flex-col gap-6 w-full">
      <div className="flex flex-col items-center gap-3">
        <img src={URL.createObjectURL(file)} alt="Preview" className="max-w-full max-h-[400px] object-contain rounded-lg border border-leica-gray" />
        <div className="flex justify-between w-full text-xs text-leica-lightgray px-2">
          <span>{file.name}</span>
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      {!isJpeg && (
        <div className="bg-red-900/20 border border-red-900 text-red-500 p-4 rounded-lg text-center text-sm">
          <strong>Notice:</strong> Cleaning EXIF is currently only supported for JPEG files. 
          To prevent corruption of your RAW image, this feature is disabled. You can still use the <strong>RAW Editor</strong> or <strong>View Exif</strong> tabs.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button className="btn btn-primary flex-1 py-4 text-base" onClick={() => handleActionClick('clean')} disabled={!isJpeg}>
          <Trash2 size={20} />
          Wipe EXIF & Download
        </button>
      </div>

      <button className="btn btn-outline mt-2" onClick={onClearFile}>
        Upload Different Photo
      </button>

      <AdModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onReward={() => {
          if (pendingAction) processImage(pendingAction);
        }}
        title="Download Cleaned Image"
        description="Watch a short ad to support our free privacy tool."
      />
    </div>
  );
};

export default CleanExifView;
