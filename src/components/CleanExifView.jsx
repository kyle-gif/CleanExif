import React from 'react';
import piexif from 'piexifjs';
import { Download, Trash2, ShieldCheck } from 'lucide-react';

const CleanExifView = ({ file, onClearFile }) => {
  const processImage = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      try {
        const newDataUrl = piexif.remove(dataUrl);
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
          To prevent corruption of your RAW image, this feature is disabled. You can still use the <strong>Photo Editor</strong> or <strong>View EXIF</strong> tabs.
        </div>
      )}

      <div className="flex items-start gap-3 bg-green-900/20 border border-green-900/50 rounded-lg p-4 text-xs text-gray-400">
        <ShieldCheck size={20} className="text-green-500 shrink-0 mt-0.5" />
        <p className="m-0 leading-relaxed">
          Metadata is removed entirely inside your browser. The cleaned copy downloads directly to your device &mdash; nothing is uploaded, stored, or shared.
        </p>
      </div>

      <button className="btn btn-primary py-4 text-base" onClick={processImage} disabled={!isJpeg}>
        <Trash2 size={20} />
        Wipe EXIF &amp; Download
      </button>

      <button className="btn btn-outline" onClick={onClearFile}>
        <Download size={18} className="rotate-180" />
        Upload a Different Photo
      </button>
    </div>
  );
};

export default CleanExifView;
