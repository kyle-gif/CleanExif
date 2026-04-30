import React, { useEffect, useState } from 'react';
import ExifReader from 'exifreader';
import { Info, MapPin, Camera, Image as ImageIcon } from 'lucide-react';

const ViewExifView = ({ file }) => {
  const [exifData, setExifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="panel text-center text-leica-lightgray py-12">Parsing metadata...</div>;
  if (error) return <div className="panel text-center text-red-500 py-12">{error}</div>;
  if (!exifData || Object.keys(exifData).length === 0) {
    return <div className="panel text-center text-leica-lightgray py-12">No EXIF data found in this image.</div>;
  }

  const getVal = (tag) => tag ? tag.description || tag.value : 'Unknown';
  const cameraMake = exifData.exif?.Make ? getVal(exifData.exif.Make) : 'Unknown';
  const cameraModel = exifData.exif?.Model ? getVal(exifData.exif.Model) : 'Unknown';
  const dateTime = exifData.exif?.DateTimeOriginal ? getVal(exifData.exif.DateTimeOriginal) : 'Unknown';
  const lensModel = exifData.exif?.LensModel ? getVal(exifData.exif.LensModel) : 'Unknown';
  const gpsLat = exifData.gps?.Latitude ? exifData.gps.Latitude : null;
  const gpsLon = exifData.gps?.Longitude ? exifData.gps.Longitude : null;

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-xl font-bold text-white border-b border-leica-gray pb-2">Found Metadata</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4">
          <Camera size={24} className="text-leica-red shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Camera</span>
            <span className="font-semibold text-white">{cameraMake} {cameraModel !== 'Unknown' ? cameraModel : ''}</span>
            <span className="text-xs text-gray-400 mt-1">{lensModel !== 'Unknown' ? lensModel : ''}</span>
          </div>
        </div>

        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4">
          <ImageIcon size={24} className="text-leica-red shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Date Taken</span>
            <span className="font-semibold text-white">{dateTime}</span>
          </div>
        </div>

        <div className="bg-leica-darkgray border border-leica-gray p-4 rounded-lg flex items-start gap-4">
          <MapPin size={24} className={gpsLat ? "text-leica-red shrink-0" : "text-gray-600 shrink-0"} />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Location (GPS)</span>
            {gpsLat && gpsLon ? (
              <span className="font-semibold text-white">{gpsLat.toFixed(4)}, {gpsLon.toFixed(4)}</span>
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
            {Object.entries(exifData.exif).slice(0, 15).map(([key, val]) => (
              <div key={key} className="flex justify-between border-b border-gray-800 pb-1">
                <span className="text-gray-500">{key}</span>
                <span className="text-gray-300 text-right max-w-[60%] truncate">{getVal(val)}</span>
              </div>
            ))}
            {Object.keys(exifData.exif).length > 15 && (
              <div className="flex justify-between pb-1"><span className="text-gray-500">...and more</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewExifView;
