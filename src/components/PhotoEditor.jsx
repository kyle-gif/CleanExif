import React, { useEffect, useRef, useState } from 'react';
import piexif from 'piexifjs';
import { Download, SlidersHorizontal, Settings } from 'lucide-react';
import { processPixels } from '../utils/imageFilters';

const PhotoEditor = ({ file, onClearFile }) => {
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  
  const [settings, setSettings] = useState({
    luminance: 0,
    contrast: 0,
    saturation: 0,
    highlights: 0,
    shadows: 0,
    kelvin: 5000,
    drClipBlack: 0,
    drClipWhite: 255,
    clarity: 0,
    sharpness: 0
  });

  const [cropRatio, setCropRatio] = useState('original'); // 'original', '3:2', '4:3', '1:1', '16:9'
  
  const [exifOverride, setExifOverride] = useState({
    enabled: false,
    make: 'Nikon',
    model: 'Z 8',
    iso: 1000,
    fnumber: 2.0,
    shutter: '1/100',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Load image
  useEffect(() => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      originalImageRef.current = img;
      renderPreview();
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Re-render when settings change
  useEffect(() => {
    if (originalImageRef.current) {
      renderPreview();
    }
  }, [settings, cropRatio]);

  const getCropDimensions = (imgWidth, imgHeight, ratio) => {
    if (ratio === 'original') return { width: imgWidth, height: imgHeight, x: 0, y: 0 };
    
    let targetRatio;
    switch(ratio) {
      case '3:2': targetRatio = 3/2; break; // APS-C / Full Frame
      case '4:3': targetRatio = 4/3; break; // M43
      case '1:1': targetRatio = 1; break;
      case '16:9': targetRatio = 16/9; break;
      default: targetRatio = imgWidth / imgHeight;
    }

    const currentRatio = imgWidth / imgHeight;
    let newWidth = imgWidth;
    let newHeight = imgHeight;
    let x = 0;
    let y = 0;

    if (currentRatio > targetRatio) {
      // Image is wider than target ratio
      newWidth = imgHeight * targetRatio;
      x = (imgWidth - newWidth) / 2;
    } else {
      // Image is taller
      newHeight = imgWidth / targetRatio;
      y = (imgHeight - newHeight) / 2;
    }

    return { width: newWidth, height: newHeight, x, y };
  };

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = originalImageRef.current;

    // Performance Optimization: Preview Canvas Size limits to 800px width max
    const MAX_PREVIEW_WIDTH = 800;
    const scale = Math.min(1, MAX_PREVIEW_WIDTH / img.width);
    
    const crop = getCropDimensions(img.width, img.height, cropRatio);
    
    canvas.width = crop.width * scale;
    canvas.height = crop.height * scale;

    // Draw scaled & cropped original
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, canvas.width, canvas.height
    );

    // Apply pixel logic
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    imageData = processPixels(imageData, settings);
    ctx.putImageData(imageData, 0, 0);
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    
    // Create high-res canvas
    const img = originalImageRef.current;
    const offscreenCanvas = document.createElement('canvas');
    const ctx = offscreenCanvas.getContext('2d');
    const crop = getCropDimensions(img.width, img.height, cropRatio);
    
    offscreenCanvas.width = crop.width;
    offscreenCanvas.height = crop.height;
    
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, offscreenCanvas.width, offscreenCanvas.height
    );

    // Process high res
    let imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    imageData = processPixels(imageData, settings);
    ctx.putImageData(imageData, 0, 0);

    const jpegDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.95);
    
    // Inject EXIF if enabled
    let finalDataUrl = jpegDataUrl;
    if (exifOverride.enabled) {
      try {
        const zerothIfd = {};
        const exifIfd = {};
        
        zerothIfd[piexif.ImageIFD.Make] = exifOverride.make;
        zerothIfd[piexif.ImageIFD.Model] = exifOverride.model;
        
        exifIfd[piexif.ExifIFD.ISOSpeedRatings] = parseInt(exifOverride.iso, 10);
        
        // Parse "1/100" to [1, 100]
        const shutterParts = exifOverride.shutter.split('/');
        if (shutterParts.length === 2) {
           exifIfd[piexif.ExifIFD.ExposureTime] = [parseInt(shutterParts[0]), parseInt(shutterParts[1])];
        }

        // FNumber is a rational [numerator, denominator] e.g. 2.8 -> [28, 10]
        exifIfd[piexif.ExifIFD.FNumber] = [Math.round(parseFloat(exifOverride.fnumber) * 10), 10];
        
        // ExposureMode Manual = 1
        exifIfd[piexif.ExifIFD.ExposureProgram] = 1;

        const exifObj = { "0th": zerothIfd, "Exif": exifIfd, "GPS": {} };
        const exifBytes = piexif.dump(exifObj);
        finalDataUrl = piexif.insert(exifBytes, jpegDataUrl);
      } catch (e) {
        console.error("Exif injection failed", e);
      }
    } else {
       // Clean EXIF is automatic because we drew onto a fresh canvas
    }

    const link = document.createElement('a');
    link.href = finalDataUrl;
    link.download = `LeicaEdited_${file.name.split('.')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsProcessing(false);
  };

  const updateSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      
      {/* Left: Preview Area */}
      <div className="flex-1 panel flex flex-col items-center justify-center bg-black overflow-hidden relative">
        <canvas 
          ref={canvasRef} 
          className="max-w-full max-h-[600px] object-contain shadow-2xl"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-medium">
            Processing High-Res Image...
          </div>
        )}
      </div>

      {/* Right: Controls Area */}
      <div className="w-full lg:w-[350px] flex flex-col gap-6">
        
        {/* Aspect Ratio Crop */}
        <div className="panel p-4">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-leica-red" />
            Crop & Aspect Ratio
          </h3>
          <select 
            className="w-full bg-leica-black border border-leica-gray text-sm text-white rounded p-2 outline-none"
            value={cropRatio}
            onChange={(e) => setCropRatio(e.target.value)}
          >
            <option value="original">Original Ratio</option>
            <option value="3:2">APS-C / Full Frame (3:2)</option>
            <option value="4:3">Micro Four Thirds (4:3)</option>
            <option value="1:1">Square (1:1)</option>
            <option value="16:9">Cinematic (16:9)</option>
          </select>
        </div>

        {/* Tone Controls */}
        <div className="panel p-4 flex flex-col gap-4">
          <h3 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <Settings size={16} className="text-leica-red" />
            Tone & Color
          </h3>
          
          <Slider label="Luminance (Exposure)" min="-100" max="100" value={settings.luminance} onChange={v => updateSetting('luminance', v)} />
          <Slider label="Contrast" min="-100" max="100" value={settings.contrast} onChange={v => updateSetting('contrast', v)} />
          <Slider label="Highlights (Recovery)" min="0" max="100" value={settings.highlights} onChange={v => updateSetting('highlights', v)} />
          <Slider label="Shadows (Recovery)" min="0" max="100" value={settings.shadows} onChange={v => updateSetting('shadows', v)} />
          
          <div className="pt-2 border-t border-leica-gray"></div>
          <Slider label="DR Clip Black (Crush Blacks)" min="0" max="100" value={settings.drClipBlack} onChange={v => updateSetting('drClipBlack', v)} />
          <Slider label="DR Clip White (Blowout)" min="150" max="255" value={settings.drClipWhite} onChange={v => updateSetting('drClipWhite', v)} />
          
          <div className="pt-2 border-t border-leica-gray"></div>
          <Slider label="White Balance (Kelvin)" min="2000" max="10000" step="100" value={settings.kelvin} onChange={v => updateSetting('kelvin', v)} />
          <Slider label="Saturation" min="-100" max="100" value={settings.saturation} onChange={v => updateSetting('saturation', v)} />
          
          <div className="pt-2 border-t border-leica-gray"></div>
          <Slider label="Sharpness / Blur" min="-100" max="100" value={settings.sharpness} onChange={v => updateSetting('sharpness', v)} />
          <Slider label="Clarity (Midtone Cont.)" min="-100" max="100" value={settings.clarity} onChange={v => updateSetting('clarity', v)} />
        </div>

        {/* EXIF Override */}
        <div className="panel p-4">
          <label className="flex items-center gap-2 text-sm text-white mb-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={exifOverride.enabled}
              onChange={(e) => setExifOverride(prev => ({...prev, enabled: e.target.checked}))}
              className="accent-leica-red"
            />
            Inject Custom EXIF (Fake Metadata)
          </label>
          
          {exifOverride.enabled && (
            <div className="grid grid-cols-2 gap-3">
              <ExifInput label="Make" val={exifOverride.make} onChange={v => setExifOverride(p => ({...p, make: v}))} />
              <ExifInput label="Model" val={exifOverride.model} onChange={v => setExifOverride(p => ({...p, model: v}))} />
              <ExifInput label="ISO" val={exifOverride.iso} onChange={v => setExifOverride(p => ({...p, iso: v}))} />
              <ExifInput label="Aperture (F)" val={exifOverride.fnumber} onChange={v => setExifOverride(p => ({...p, fnumber: v}))} />
              <ExifInput label="Shutter Speed" val={exifOverride.shutter} onChange={v => setExifOverride(p => ({...p, shutter: v}))} />
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary w-full py-4 text-lg font-bold" 
          onClick={handleDownload}
          disabled={isProcessing}
        >
          <Download size={20} />
          {isProcessing ? 'Processing...' : 'Download Final JPEG'}
        </button>
        
        <button className="btn btn-outline w-full" onClick={onClearFile}>
          Upload Different Photo
        </button>
      </div>
    </div>
  );
};

// Helper components
const Slider = ({ label, min, max, step="1", value, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-xs text-leica-lightgray">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <input 
      type="range" 
      min={min} max={max} step={step} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

const ExifInput = ({ label, val, onChange }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-leica-lightgray uppercase tracking-wider">{label}</span>
    <input 
      type="text" 
      value={val} 
      onChange={e => onChange(e.target.value)}
      className="bg-leica-black border border-leica-gray text-white text-xs p-1.5 rounded outline-none focus:border-leica-red"
    />
  </div>
);

export default PhotoEditor;
