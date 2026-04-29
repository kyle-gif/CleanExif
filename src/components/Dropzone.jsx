import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ShieldCheck } from 'lucide-react';
import './Dropzone.css';

const Dropzone = ({ onDropFile }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onDropFile(acceptedFiles[0]);
    }
  }, [onDropFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/x-sony-arw': ['.arw'],
      'image/x-adobe-dng': ['.dng'],
      'image/x-canon-cr2': ['.cr2'],
      'image/x-nikon-nef': ['.nef'],
      'application/octet-stream': ['.dsc']
    },
    maxFiles: 1
  });

  return (
    <div className="dropzone-wrapper glass-panel">
      <div 
        {...getRootProps()} 
        className={`dropzone-area ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloud size={48} color={isDragActive ? 'var(--primary-color)' : 'var(--text-secondary)'} />
        <h3>{isDragActive ? 'Drop photo here' : 'Drag & Drop your photo here'}</h3>
        <p>Supports JPEG, ARW, DNG, CR2, NEF, DSC</p>
      </div>
      
      <div className="privacy-badge">
        <ShieldCheck size={20} color="#34c759" />
        <div>
          <strong>100% Secure & Private</strong>
          <p>Your photos are processed locally in your browser and never sent to any server.</p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
