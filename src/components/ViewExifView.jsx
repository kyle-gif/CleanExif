import React, { useEffect, useState } from 'react';
import ExifReader from 'exifreader';
import { Info, MapPin, Camera, Image as ImageIcon, Crosshair } from 'lucide-react';

const ViewExifView = ({ file }) => {
  const [exifData, setExifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllExif, setShowAllExif] = useState(false);
  const [locationName, setLocationName] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    if (!file) return;
    const parseExif = async () => {
      try {
        setLoading(true);
        const tags = await ExifReader.load(file, { expanded: true });
        setExifData(tags);
      } catch (err) {
        setError("Could not extract EXIF data. The file might not contain any.");
      } finally {
        setLoading(false);
      }
    };
    parseExif();
  }, [file]);

  const getVal = (tag) => {
    if (!tag) return 'Unknown';
    if (typeof tag === 'string' || typeof tag === 'number') return tag;
    return tag.description || tag.value || 'Unknown';
  };

  // Safe GPS extraction
  const getGpsCoords = () => {
    if (!exifData) return null;
    const gpsData = exifData.gps || exifData.exif;
    if (!gpsData) return null;

    let lat = gpsData.Latitude || gpsData.GPSLatitude;
    let lon = gpsData.Longitude || gpsData.GPSLongitude;
    
    if (!lat || !lon) return null;

    const parseCoordinate = (tag, refTag) => {
       if (typeof tag === 'number') return tag;
       if (typeof tag === 'string') {
          const num = parseFloat(tag);
          if (!isNaN(num) && tag.length < 15) return num;
       }
       
       if (tag && Array.isArray(tag.value) && tag.value.length === 3 && Array.isArray(tag.value[0])) {
          const d = tag.value[0][0] / (tag.value[0][1] || 1);
          const m = tag.value[1][0] / (tag.value[1][1] || 1);
          const s = tag.value[2][0] / (tag.value[2][1] || 1);
          let decimal = d + (m / 60) + (s / 3600);
          
          if (refTag && (typeof refTag === 'string' || typeof refTag.value === 'string')) {
             const refStr = typeof refTag === 'string' ? refTag : refTag.value[0];
             if (refStr === 'S' || refStr === 'W') decimal = -decimal;
          }
          return decimal;
       }

       if (tag && tag.description !== undefined) {
          const num = parseFloat(tag.description);
          if (!isNaN(num) && !tag.description.includes('deg')) return num;
       }

       return getVal(tag);
    };

    const parsedLat = parseCoordinate(lat, gpsData.GPSLatitudeRef);
    const parsedLon = parseCoordinate(lon, gpsData.GPSLongitudeRef);

    return { lat: parsedLat, lon: parsedLon };
  };
  const gps = getGpsCoords();

  useEffect(() => {
    if (!gps || typeof gps.lat !== 'number' || typeof gps.lon !== 'number') {
      setLocationName(null);
      return;
    }
    
    let isMounted = true;
    const fetchLocation = async () => {
      setFetchingLocation(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${gps.lat}&lon=${gps.lon}&zoom=10&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' }
        });
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        
        if (isMounted && data && data.display_name) {
           let shortName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
           if (data.address?.country) {
             shortName += (shortName ? ', ' : '') + data.address.country;
           }
           setLocationName(shortName || data.display_name.split(',').slice(0, 2).join(', '));
        }
      } catch (err) {
        console.error('Failed to reverse geocode', err);
        if (isMounted) setLocationName('Location lookup failed');
      } finally {
        if (isMounted) setFetchingLocation(false);
      }
    };
    
    fetchLocation();
    return () => { isMounted = false; };
  }, [gps?.lat, gps?.lon]);

  if (loading) return <div className="panel text-center text-leica-lightgray py-12">Parsing metadata...</div>;
  if (error) return <div className="panel text-center text-red-500 py-12">{error}</div>;
  if (!exifData || Object.keys(exifData).length === 0) {
    return <div className="panel text-center text-leica-lightgray py-12">No EXIF data found in this image.</div>;
  }

  const cameraMake = exifData.exif?.Make ? getVal(exifData.exif.Make) : 'Unknown';
  const cameraModel = exifData.exif?.Model ? getVal(exifData.exif.Model) : 'Unknown';
  let dateTime = exifData.exif?.DateTimeOriginal ? getVal(exifData.exif.DateTimeOriginal) : 'Unknown';
  if (dateTime !== 'Unknown' && typeof dateTime === 'string') {
     dateTime = dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1/$2/$3');
  }
  const lensModel = exifData.exif?.LensModel ? getVal(exifData.exif.LensModel) : 'Unknown';
  
  // Exposure Data
  const iso = exifData.exif?.ISOSpeedRatings ? getVal(exifData.exif.ISOSpeedRatings) : null;
  let shutter = exifData.exif?.ExposureTime ? getVal(exifData.exif.ExposureTime) : null;
  if (shutter && !shutter.toString().includes('/')) {
     const dec = parseFloat(shutter);
     if (dec > 0 && dec < 1) shutter = `1/${Math.round(1/dec)}`;
  }
  let aperture = exifData.exif?.FNumber ? getVal(exifData.exif.FNumber) : null;
  if (aperture && !aperture.toString().includes('f/')) {
     aperture = `f/${parseFloat(aperture).toFixed(1)}`;
  }
  let focalLength = exifData.exif?.FocalLength ? getVal(exifData.exif.FocalLength) : null;
  if (focalLength && !focalLength.toString().includes('mm')) {
      focalLength = `${parseFloat(focalLength)}mm`;
  }
  
  // Offset Time
  let offsetTime = exifData.exif?.OffsetTimeOriginal || exifData.exif?.OffsetTime || null;
  if (offsetTime) {
     offsetTime = getVal(offsetTime);
     if (!offsetTime.startsWith('UTC')) offsetTime = `UTC${offsetTime}`;
  }



  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-bold text-white border-b border-leica-gray pb-2">Found Metadata</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Core Camera Info */}
        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4 lg:col-span-3">
          <Camera size={28} className="text-leica-red shrink-0" />
          <div className="flex flex-col w-full">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Camera & Lens</span>
            <span className="font-semibold text-white text-xl">{cameraMake} {cameraModel !== 'Unknown' ? cameraModel : ''}</span>
            <span className="text-sm text-gray-400 mt-1">{lensModel !== 'Unknown' ? lensModel : 'Lens Not Recorded'}</span>
            
            {/* Primary Exposure Ribbon */}
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-700">
               {iso && (
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase text-gray-500 tracking-wider">ISO</span>
                   <span className="font-bold text-white text-lg">{iso}</span>
                 </div>
               )}
               {shutter && (
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase text-gray-500 tracking-wider">Shutter Speed</span>
                   <span className="font-bold text-white text-lg">{shutter}s</span>
                 </div>
               )}
               {aperture && (
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase text-gray-500 tracking-wider">Aperture</span>
                   <span className="font-bold text-white text-lg">{aperture}</span>
                 </div>
               )}
               {focalLength && (
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase text-gray-500 tracking-wider">Focal Length</span>
                   <span className="font-bold text-white text-lg">{focalLength}</span>
                 </div>
               )}
            </div>
          </div>
        </div>


        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4">
          <ImageIcon size={24} className="text-leica-red shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Date Taken</span>
            <span className="font-semibold text-white">{dateTime}</span>
            {offsetTime && <span className="text-xs text-gray-400 mt-1">{offsetTime}</span>}
          </div>
        </div>

        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4">
          <MapPin size={24} className={gps ? "text-leica-red shrink-0" : "text-gray-600 shrink-0"} />
          <div className="flex flex-col w-full overflow-hidden">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Location (GPS)</span>
            {gps ? (
              <div className="flex flex-col">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lon}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-semibold text-white text-sm truncate hover:text-leica-red hover:underline transition-colors"
                  title="View on Google Maps"
                >
                  {fetchingLocation ? 'Locating on Map...' : (locationName || 'View on Google Maps')}
                </a>
                <span className="text-[11px] text-gray-500 mt-0.5 font-mono">
                  {typeof gps.lat === 'number' ? gps.lat.toFixed(5) : gps.lat}, {typeof gps.lon === 'number' ? gps.lon.toFixed(5) : gps.lon}
                </span>
              </div>
            ) : (
              <span className="font-semibold text-gray-500">No GPS data</span>
            )}
          </div>
        </div>

        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4">
          <Info size={24} className="text-leica-red shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Image Size</span>
            <span className="font-semibold text-white">
              {exifData.file?.['Image Width'] ? getVal(exifData.file['Image Width']) : '?'} x 
              {exifData.file?.['Image Height'] ? getVal(exifData.file['Image Height']) : '?'}
            </span>
          </div>
        </div>
      </div>

      {exifData.exif && Object.keys(exifData.exif).length > 0 && (
        <div className="panel mt-4">
          <h4 className="text-sm font-medium text-leica-lightgray mb-4">Raw EXIF Properties ({Object.keys(exifData.exif).length})</h4>
          <div className="flex flex-col gap-2 font-mono text-xs">
            {Object.entries(exifData.exif).slice(0, showAllExif ? undefined : 15).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">{key}</span>
                <span className="text-gray-300 text-right max-w-[60%] truncate">{getVal(val)}</span>
              </div>
            ))}
            {!showAllExif && Object.keys(exifData.exif).length > 15 && (
              <button 
                onClick={() => setShowAllExif(true)}
                className="mt-4 text-leica-red font-semibold hover:text-red-400 transition-colors text-center w-full py-2 border border-leica-red/30 rounded"
              >
                Load More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewExifView;
