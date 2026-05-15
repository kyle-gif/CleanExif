import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ShieldCheck } from 'lucide-react';

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
    <div className="flex flex-col gap-6 w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[250px]
          ${isDragActive ? 'border-leica-red bg-red-900/10' : 'border-leica-gray bg-leica-darkgray hover:border-gray-500 hover:bg-gray-800'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud size={56} className={`mb-4 ${isDragActive ? 'text-leica-red' : 'text-gray-500'}`} />
        <h3 className="text-xl font-medium text-white mb-2">
          {isDragActive ? 'Drop photo here' : 'Drag & Drop your photo'}
        </h3>
        <p className="text-sm text-leica-lightgray">
          Supports JPEG, ARW, DNG, CR2, NEF, DSC
        </p>
      </div>
      
      <div className="flex items-start gap-4 bg-green-900/20 border border-green-900/50 rounded-lg p-4">
        <ShieldCheck size={24} className="text-green-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-green-500 mb-1">100% Secure & Private</strong>
          <p className="text-xs text-gray-400 m-0 leading-relaxed">
            Photos are never uploaded to any server. All metadata wiping and pixel processing happens securely and locally within your browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
