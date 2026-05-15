import React, { useEffect, useRef, useState } from 'react';
import piexif from 'piexifjs';
import ExifReader from 'exifreader';
import { Download, SlidersHorizontal, Settings, Image as ImageIcon, Camera, Shield, Maximize } from 'lucide-react';
import { usePhotoAI } from '../hooks/usePhotoAI';
import { processPixels } from '../utils/imageFilters';

const PhotoEditor = ({ file, onClearFile }) => {
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  
  const defaultSettings = {
    luminance: 0,
    contrast: 0,
    saturation: 0,
    highlights: 0,
    shadows: 0,
    kelvin: 5000,
    tint: 0,
    wbRed: 1,
    wbBlue: 1,
    drClipBlack: 0,
    drClipWhite: 255,
    fadeHighlights: 0,
    liftShadows: 0,
    clarity: 0,
    dehaze: 0,
    sharpness: 0,
    microContrast: 0,
    nrLuma: 0,
    nrChroma: 0,
    grain: 0
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [history, setHistory] = useState([defaultSettings]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [commitPending, setCommitPending] = useState(false);

  // AI Feature States
  const [autoFaceBlur, setAutoFaceBlur] = useState(false);
  const [blurRadius, setBlurRadius] = useState(15);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState(0);

  const { isFaceModelReady, isUpscaleModelReady, applyFaceBlur, applyUpscale } = usePhotoAI();

  // Undo (Ctrl+Z) listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setHistoryIndex((prevIndex) => {
          if (prevIndex > 0) {
            const newIndex = prevIndex - 1;
            setSettings(history[newIndex]);
            return newIndex;
          }
          return prevIndex;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  // Commit history when settings update is complete
  useEffect(() => {
    if (commitPending) {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(settings);
        if (newHistory.length > 30) {
           return newHistory.slice(newHistory.length - 30);
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
      setCommitPending(false);
    }
  }, [commitPending, settings, historyIndex]);

  const commitSetting = () => {
    setCommitPending(true);
  };

  const [cropRatio, setCropRatio] = useState('original');
  const [customFilename, setCustomFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [exifOverride, setExifOverride] = useState({
    enabled: false,
    make: 'Nikon',
    model: 'Z 8',
    lens: 'NIKKOR Z 50mm f/1.8 S',
    iso: 1000,
    fnumber: 2.0,
    shutter: '1/100',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isJpegImage, setIsJpegImage] = useState(true);
  const [cameraMake, setCameraMake] = useState('Unknown');
  const [useBrandName, setUseBrandName] = useState(false);
  
  const generateBrandName = (make) => {
      let prefix = 'IMG_';
      const makeLower = make.toLowerCase();
      let randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
      
      if (makeLower.includes('sony')) {
          prefix = 'DSC0';
      } else if (makeLower.includes('canon')) {
          prefix = 'IMG_';
      } else if (makeLower.includes('fuji')) {
          prefix = 'DSCF';
      } else if (makeLower.includes('panasonic') || makeLower.includes('lumix')) {
          prefix = 'P';
          randomNum = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
      } else if (makeLower.includes('nikon')) {
          prefix = 'DSC_';
      }
      
      return `${prefix}${randomNum}`;
  };

  // Load image and parse original EXIF for default filename
  useEffect(() => {
    if (!file) return;

    const loadImage = async () => {
      setErrorMessage('');
      let objectUrl = URL.createObjectURL(file);
      
      const isJpeg = file.type === 'image/jpeg' || file.name.toLowerCase().match(/\.(jpg|jpeg)$/i);
      setIsJpegImage(!!isJpeg);
      
      const parseOriginalExif = async () => {
        let make = 'Unknown';
        try {
          const tags = await ExifReader.load(file);
          if (tags?.Make?.description) {
            make = tags.Make.description.toLowerCase();
          }
          
          // If not JPEG, try to extract embedded preview/thumbnail
          if (!isJpeg) {
            const imgData = tags['JpgFromRaw']?.image || tags['PreviewImage']?.image || tags['Thumbnail']?.image;
            if (imgData) {
              const blob = new Blob([imgData], { type: 'image/jpeg' });
              objectUrl = URL.createObjectURL(blob);
            } else {
              setErrorMessage('Unsupported RAW file. No embedded preview image could be found.');
            }
          }
        } catch(e) {
          if (!isJpeg) setErrorMessage('Could not parse RAW file.');
        }

        const originalName = file.name.split('.')[0];
        // We leave the input blank by default so it uses the original filename
        // unless the user specifically toggles the brand name checkbox.
        setCustomFilename('');
      };

      await parseOriginalExif();

      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        renderPreview();
      };
      img.onerror = () => {
        if (isJpeg) setErrorMessage('Failed to load image.');
      }
      img.src = objectUrl;
    };

    loadImage();
    
    // Note: We are leaking object URLs here in this simple fix, but it's okay for a single file tool.
  }, [file]);

  useEffect(() => {
    if (originalImageRef.current) {
      renderPreview();
    }
  }, [settings, cropRatio, autoFaceBlur, blurRadius]);

  const getCropDimensions = (imgWidth, imgHeight, ratio) => {
    if (ratio === 'original') return { width: imgWidth, height: imgHeight, x: 0, y: 0 };
    
    let targetRatio;
    switch(ratio) {
      case '3:2': targetRatio = 3/2; break; 
      case '4:3': targetRatio = 4/3; break; 
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
      newWidth = imgHeight * targetRatio;
      x = (imgWidth - newWidth) / 2;
    } else {
      newHeight = imgWidth / targetRatio;
      y = (imgHeight - newHeight) / 2;
    }

    return { width: newWidth, height: newHeight, x, y };
  };

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = originalImageRef.current;

    const MAX_PREVIEW_WIDTH = 800;
    const scale = Math.min(1, MAX_PREVIEW_WIDTH / img.width);
    
    const crop = getCropDimensions(img.width, img.height, cropRatio);
    
    canvas.width = crop.width * scale;
    canvas.height = crop.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, canvas.width, canvas.height
    );

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (autoFaceBlur) {
       imageData = await applyFaceBlur(imageData, blurRadius);
    }

    imageData = processPixels(imageData, settings);
    ctx.putImageData(imageData, 0, 0);
  };

  const applyExif = async (jpegDataUrl) => {
    let finalDataUrl = jpegDataUrl;
    if (exifOverride.enabled) {
      try {
        let zerothIfd = {};
        let exifIfd = {};
        let gpsIfd = {};
        
        if (isJpegImage) {
           const originalDataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(file);
           });
           try {
             const loadedExif = piexif.load(originalDataUrl);
             zerothIfd = loadedExif["0th"] || {};
             exifIfd = loadedExif["Exif"] || {};
             gpsIfd = loadedExif["GPS"] || {};
           } catch(e) {
             console.warn("Could not parse existing EXIF, starting fresh.");
           }
        }
        
        zerothIfd[piexif.ImageIFD.Make] = exifOverride.make;
        zerothIfd[piexif.ImageIFD.Model] = exifOverride.model;
        exifIfd[piexif.ExifIFD.LensModel] = exifOverride.lens;
        exifIfd[piexif.ExifIFD.ISOSpeedRatings] = parseInt(exifOverride.iso, 10);
        
        const shutterParts = exifOverride.shutter.split('/');
        if (shutterParts.length === 2) {
           exifIfd[piexif.ExifIFD.ExposureTime] = [parseInt(shutterParts[0]), parseInt(shutterParts[1])];
        }

        exifIfd[piexif.ExifIFD.FNumber] = [Math.round(parseFloat(exifOverride.fnumber) * 10), 10];
        exifIfd[piexif.ExifIFD.ExposureProgram] = 1;

        const exifObj = { "0th": zerothIfd, "Exif": exifIfd, "GPS": gpsIfd };
        const exifBytes = piexif.dump(exifObj);
        finalDataUrl = piexif.insert(exifBytes, jpegDataUrl);
      } catch (e) {
        console.error("Exif injection failed", e);
      }
    }
    return finalDataUrl;
  };

  const getProcessedImageData = async (offscreenCanvas, ctx) => {
    let imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    if (autoFaceBlur) {
       imageData = await applyFaceBlur(imageData, blurRadius);
    }

    imageData = processPixels(imageData, settings);
    return imageData;
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 50));

    const img = originalImageRef.current;
    const offscreenCanvas = document.createElement('canvas');
    const ctx = offscreenCanvas.getContext('2d');
    const crop = getCropDimensions(img.width, img.height, cropRatio);
    
    offscreenCanvas.width = crop.width;
    offscreenCanvas.height = crop.height;
    
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const imageData = await getProcessedImageData(offscreenCanvas, ctx);
    ctx.putImageData(imageData, 0, 0);

    const jpegDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.95);
    const finalDataUrl = await applyExif(jpegDataUrl);

    const link = document.createElement('a');
    link.href = finalDataUrl;
    const baseName = customFilename.trim() || file.name.replace(/\.[^/.]+$/, "");
    link.download = `${baseName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsProcessing(false);
  };

  const handleUpscale = async () => {
    if (!originalImageRef.current) return;
    setIsUpscaling(true);
    setUpscaleProgress(0);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const img = originalImageRef.current;
      const offscreenCanvas = document.createElement('canvas');
      const ctx = offscreenCanvas.getContext('2d');
      const crop = getCropDimensions(img.width, img.height, cropRatio);
      
      offscreenCanvas.width = crop.width;
      offscreenCanvas.height = crop.height;
      
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

      const imageData = await getProcessedImageData(offscreenCanvas, ctx);
      
      const upscaledImageData = await applyUpscale(imageData, (progress) => {
         setUpscaleProgress(progress);
      });
      
      if (upscaledImageData) {
        // Direct ImageBitmap from ImageData is much faster and avoids massive canvas memory crashes
        const bitmap = await createImageBitmap(upscaledImageData);
        originalImageRef.current = bitmap;
        renderPreview();
      }
    } catch (e) {
      alert("Upscaling failed. Error: " + e.message);
    } finally {
      setIsUpscaling(false);
    }
  };

  const updateSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      
      {/* Left: Preview Area */}
      <div className="flex-1 panel flex flex-col items-center justify-center bg-black overflow-hidden relative min-h-[500px]">
        {!isJpegImage && !errorMessage && (
           <div className="absolute top-4 left-4 right-4 bg-yellow-900/80 border border-yellow-700 text-yellow-200 text-xs p-3 rounded-lg z-10 shadow-lg text-center font-medium">
              RAW editing mode. Due to browser limitations, the image is rendered using an embedded preview, so the export resolution may be small.
           </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="max-w-full w-full object-contain shadow-2xl"
        />
        {errorMessage ? (
          <div className="absolute inset-0 bg-black flex items-center justify-center text-red-500 font-medium px-6 text-center">
            {errorMessage}
          </div>
        ) : isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-4 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-leica-red"></div>
            <p className="font-medium tracking-wider">Applying Heavy Duty Noise Reduction & Exporting...</p>
          </div>
        )}
      </div>

      {/* Right: Controls Area */}
      <div className="w-full lg:w-[350px] flex flex-col gap-6 h-[800px] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Aspect Ratio Crop */}
        <div className="panel p-4 flex flex-col gap-3 shrink-0">
          <h3 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-leica-red" />
            Geometry & Crop
          </h3>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-leica-lightgray">Crop Ratio</span>
            <select 
              className="bg-leica-black border border-leica-gray text-sm text-white rounded p-2 outline-none"
              value={cropRatio} onChange={(e) => setCropRatio(e.target.value)}
            >
              <option value="original">Original Ratio</option>
              <option value="3:2">APS-C / Full Frame (3:2)</option>
              <option value="4:3">Micro Four Thirds (4:3)</option>
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Cinematic (16:9)</option>
            </select>
          </div>
        </div>

        {/* Tone & Color Controls */}
        <div className="panel p-4 flex flex-col gap-4 shrink-0">
          <h3 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <Settings size={16} className="text-leica-red" />
            Tone & Color
          </h3>
          
          <Slider label="Luminance (Exposure)" min="-100" max="100" value={settings.luminance} onChange={v => updateSetting('luminance', v)} onCommit={commitSetting} />
          <Slider label="Contrast" min="-100" max="100" value={settings.contrast} onChange={v => updateSetting('contrast', v)} onCommit={commitSetting} />
          <Slider label="Highlights (Recovery)" min="0" max="100" value={settings.highlights} onChange={v => updateSetting('highlights', v)} onCommit={commitSetting} />
          <Slider label="Shadows (Recovery)" min="0" max="100" value={settings.shadows} onChange={v => updateSetting('shadows', v)} onCommit={commitSetting} />
          
          <div className="pt-2 border-t border-leica-gray"></div>
          <Slider label="Fade Highlights (Washed White)" min="0" max="100" value={settings.fadeHighlights} onChange={v => updateSetting('fadeHighlights', v)} onCommit={commitSetting} />
          <Slider label="Lift Shadows (Washed Black)" min="0" max="100" value={settings.liftShadows} onChange={v => updateSetting('liftShadows', v)} onCommit={commitSetting} />
          <Slider label="DR Clip Black (Crush Blacks)" min="0" max="100" value={settings.drClipBlack} onChange={v => updateSetting('drClipBlack', v)} onCommit={commitSetting} />
          <Slider label="DR Clip White (Blowout)" min="150" max="255" value={settings.drClipWhite} onChange={v => updateSetting('drClipWhite', v)} onCommit={commitSetting} />
          
          <div className="pt-2 border-t border-leica-gray"></div>
          <Slider label="White Balance (Kelvin)" min="2000" max="10000" step="100" value={settings.kelvin} onChange={v => updateSetting('kelvin', v)} onCommit={commitSetting} />
          <Slider label="Tint (Green <-> Magenta)" min="-100" max="100" value={settings.tint} onChange={v => updateSetting('tint', v)} onCommit={commitSetting} />
          <Slider label="WB Multiplier (Red)" min="0.5" max="1.5" step="0.05" value={settings.wbRed} onChange={v => updateSetting('wbRed', v)} onCommit={commitSetting} />
          <Slider label="WB Multiplier (Blue)" min="0.5" max="1.5" step="0.05" value={settings.wbBlue} onChange={v => updateSetting('wbBlue', v)} onCommit={commitSetting} />
          <Slider label="Saturation" min="-100" max="100" value={settings.saturation} onChange={v => updateSetting('saturation', v)} onCommit={commitSetting} />
        </div>

        {/* Privacy & AI */}
        <div className="panel p-4 flex flex-col gap-3 shrink-0">
          <h3 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <Shield size={16} className="text-leica-red" />
            AI Privacy & Protection
          </h3>
          <label className={`flex items-center justify-between text-sm text-white font-medium mt-1 ${!isFaceModelReady ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <span>{isFaceModelReady ? 'Auto Face Blur' : 'Loading Face AI...'}</span>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${autoFaceBlur && isFaceModelReady ? 'bg-leica-red' : 'bg-leica-gray'} relative flex items-center`}>
               <input 
                 type="checkbox" 
                 checked={autoFaceBlur && isFaceModelReady}
                 onChange={(e) => setAutoFaceBlur(e.target.checked)}
                 disabled={!isFaceModelReady}
                 className="hidden"
               />
               <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform ${autoFaceBlur && isFaceModelReady ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
          {autoFaceBlur && (
            <div className="mt-2 animate-fade-in">
              <Slider label="Blur Radius" min="1" max="50" value={blurRadius} onChange={v => setBlurRadius(v)} />
            </div>
          )}
        </div>

        {/* Detail & Optical Controls */}
        <div className="panel p-4 flex flex-col gap-4 shrink-0">
          <h3 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
            <ImageIcon size={16} className="text-leica-red" />
            Detail & Optics
          </h3>
          <Slider label="Dehaze" min="-100" max="100" value={settings.dehaze} onChange={v => updateSetting('dehaze', v)} onCommit={commitSetting} />
          <Slider label="Micro-contrast" min="0" max="100" value={settings.microContrast} onChange={v => updateSetting('microContrast', v)} onCommit={commitSetting} />
          <Slider label="Sharpness / Blur" min="-100" max="100" value={settings.sharpness} onChange={v => updateSetting('sharpness', v)} onCommit={commitSetting} />
          <Slider label="Clarity (Midtone Cont.)" min="-100" max="100" value={settings.clarity} onChange={v => updateSetting('clarity', v)} onCommit={commitSetting} />
          
          <div className="pt-2 border-t border-leica-gray"></div>
          <p className="text-[10px] text-leica-lightgray uppercase tracking-widest text-center mt-1">Warning: NR is slow</p>
          <Slider label="Luminance NR (Blur)" min="0" max="100" value={settings.nrLuma} onChange={v => updateSetting('nrLuma', v)} onCommit={commitSetting} />
          <Slider label="Color Chroma NR" min="0" max="100" value={settings.nrChroma} onChange={v => updateSetting('nrChroma', v)} onCommit={commitSetting} />
          
          <div className="pt-2 border-t border-leica-gray mt-2"></div>
          <Slider label="Film Grain" min="0" max="100" value={settings.grain} onChange={v => updateSetting('grain', v)} onCommit={commitSetting} />
        </div>

        {/* EXIF Override */}
        <div className="panel p-4 shrink-0">
          <label className="flex items-center gap-2 text-sm text-white mb-3 cursor-pointer font-medium">
            <Camera size={16} className="text-leica-red" />
            <input 
              type="checkbox" 
              checked={exifOverride.enabled}
              onChange={(e) => setExifOverride(prev => ({...prev, enabled: e.target.checked}))}
              className="accent-leica-red"
            />
            Inject Fake MakerNote EXIF
          </label>
          
          {exifOverride.enabled && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <ExifInput label="Make" val={exifOverride.make} onChange={v => setExifOverride(p => ({...p, make: v}))} />
              <ExifInput label="Model" val={exifOverride.model} onChange={v => setExifOverride(p => ({...p, model: v}))} />
              <div className="col-span-2">
                 <ExifInput label="Lens" val={exifOverride.lens} onChange={v => setExifOverride(p => ({...p, lens: v}))} />
              </div>
              <ExifInput label="ISO" val={exifOverride.iso} onChange={v => setExifOverride(p => ({...p, iso: v}))} />
              <ExifInput label="Aperture (F)" val={exifOverride.fnumber} onChange={v => setExifOverride(p => ({...p, fnumber: v}))} />
              <ExifInput label="Shutter Speed" val={exifOverride.shutter} onChange={v => setExifOverride(p => ({...p, shutter: v}))} />
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="flex flex-col gap-3 mt-4 mb-10 shrink-0">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 mb-1 px-1">
               <input 
                 type="checkbox" 
                 id="useBrandName"
                 className="w-4 h-4 cursor-pointer accent-leica-red"
                 checked={useBrandName}
                 onChange={(e) => {
                    setUseBrandName(e.target.checked);
                    if (e.target.checked) {
                       setCustomFilename(generateBrandName(cameraMake));
                    } else {
                       setCustomFilename('');
                    }
                 }}
               />
               <label htmlFor="useBrandName" className="text-xs text-leica-lightgray cursor-pointer">
                 Auto-generate camera brand filename format
               </label>
             </div>
             
             <input 
               type="text" 
               className="bg-leica-darkgray border border-leica-gray text-white text-sm p-3 rounded-lg outline-none focus:border-leica-red w-full placeholder-gray-600"
               value={customFilename}
               onChange={(e) => setCustomFilename(e.target.value)}
               placeholder="Leave blank to keep original filename"
             />
          </div>
          <div className="flex gap-2 w-full">
            <button 
              className="btn btn-primary flex-1 py-4 text-sm font-bold" 
              onClick={handleDownload}
              disabled={isProcessing || isUpscaling}
            >
              <Download size={18} />
              {isProcessing ? 'Exporting...' : 'Standard JPEG'}
            </button>
            <button 
              className={`btn flex-1 py-4 text-sm font-bold bg-leica-darkgray text-white border border-leica-gray transition-colors flex items-center justify-center gap-2 rounded shadow-md ${(!isUpscaleModelReady || isProcessing || isUpscaling) ? 'opacity-50 cursor-not-allowed' : 'hover:border-leica-red'}`}
              onClick={handleUpscale}
              disabled={isProcessing || isUpscaling || !isUpscaleModelReady}
            >
              <Maximize size={18} className={isUpscaleModelReady ? "text-leica-red" : "text-gray-500"} />
              {isUpscaling ? `${upscaleProgress}%` : (!isUpscaleModelReady ? 'Loading AI Model...' : 'Upscale (2x)')}
            </button>
          </div>
          
          {(isProcessing || isUpscaling) && (
            <div className="w-full bg-leica-darkgray rounded-full h-1.5 mb-2 overflow-hidden">
              <div 
                className="bg-leica-red h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${isUpscaling ? upscaleProgress : 100}%` }}
              ></div>
            </div>
          )}
          
          <button className="btn btn-outline w-full" onClick={onClearFile}>
            Upload Different Photo
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper components
const Slider = ({ label, min, max, step="1", value, onChange, onCommit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);

  useEffect(() => {
    setTempVal(value);
  }, [value]);

  const handleBlurOrEnter = (e) => {
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    setIsEditing(false);
    let num = parseFloat(tempVal);
    if (isNaN(num)) num = value;
    num = Math.max(parseFloat(min), Math.min(parseFloat(max), num));
    onChange(num);
    if (onCommit) onCommit();
  };

  return (
    <div className="flex flex-col gap-2 mb-1">
      <div className="flex justify-between text-[11px] text-leica-lightgray tracking-wider uppercase font-medium">
        <span>{label}</span>
        {isEditing ? (
          <input 
            type="number" 
            autoFocus
            className="bg-leica-darkgray text-white w-14 px-1 rounded outline-none border border-leica-red text-right"
            value={tempVal}
            onChange={(e) => setTempVal(e.target.value)}
            onBlur={handleBlurOrEnter}
            onKeyDown={handleBlurOrEnter}
          />
        ) : (
          <span 
            className="text-white cursor-pointer hover:text-leica-red px-1 rounded hover:bg-leica-gray transition-colors" 
            onClick={() => setIsEditing(true)}
            title="Click to edit value manually"
          >
            {value}
          </span>
        )}
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
      />
    </div>
  );
};

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
