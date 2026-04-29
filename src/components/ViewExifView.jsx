import React, { useEffect, useState } from 'react';
import ExifReader from 'exifreader';
import { Info, MapPin, Camera, Image as ImageIcon } from 'lucide-react';
import './ViewExifView.css';

const ViewExifView = ({ file }) => {
  const [exifData, setExifData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) return;

    const parseExif = async () => {
      try {
        setLoading(true);
        // ExifReader can read from a File object directly
        const tags = await ExifReader.load(file, { expanded: true });
        setExifData(tags);
      } catch (err) {
        console.error("Exif parsing error", err);
        setError("Could not extract EXIF data. The file might not contain any.");
      } finally {
        setLoading(false);
      }
    };

    parseExif();
  }, [file]);

  if (loading) return <div className="glass-panel text-center">Parsing metadata...</div>;
  if (error) return <div className="glass-panel text-center error-text">{error}</div>;
  if (!exifData || Object.keys(exifData).length === 0) {
    return <div className="glass-panel text-center">No EXIF data found in this image.</div>;
  }

  // Helper to extract safe values
  const getVal = (tag) => tag ? tag.description || tag.value : 'Unknown';

  const cameraMake = exifData.exif?.Make ? getVal(exifData.exif.Make) : 'Unknown';
  const cameraModel = exifData.exif?.Model ? getVal(exifData.exif.Model) : 'Unknown';
  const dateTime = exifData.exif?.DateTimeOriginal ? getVal(exifData.exif.DateTimeOriginal) : 'Unknown';
  const lensModel = exifData.exif?.LensModel ? getVal(exifData.exif.LensModel) : 'Unknown';
  
  // GPS
  const gpsLat = exifData.gps?.Latitude ? exifData.gps.Latitude : null;
  const gpsLon = exifData.gps?.Longitude ? exifData.gps.Longitude : null;

  return (
    <div className="view-exif-container glass-panel">
      <h3>Found Metadata</h3>
      
      <div className="exif-grid">
        <div className="exif-card">
          <Camera size={24} color="var(--primary-color)" />
          <div className="exif-details">
            <span className="label">Camera</span>
            <span className="value">{cameraMake} {cameraModel !== 'Unknown' ? cameraModel : ''}</span>
            <span className="sub-value">{lensModel !== 'Unknown' ? lensModel : ''}</span>
          </div>
        </div>

        <div className="exif-card">
          <ImageIcon size={24} color="var(--primary-color)" />
          <div className="exif-details">
            <span className="label">Date Taken</span>
            <span className="value">{dateTime}</span>
          </div>
        </div>

        <div className="exif-card">
          <MapPin size={24} color={gpsLat ? "#ff3b30" : "var(--text-secondary)"} />
          <div className="exif-details">
            <span className="label">Location (GPS)</span>
            {gpsLat && gpsLon ? (
              <span className="value">{gpsLat.toFixed(4)}, {gpsLon.toFixed(4)}</span>
            ) : (
              <span className="value text-muted">No GPS data</span>
            )}
          </div>
        </div>

        <div className="exif-card">
          <Info size={24} color="var(--primary-color)" />
          <div className="exif-details">
            <span className="label">Image Size</span>
            <span className="value">
              {exifData.file?.['Image Width'] ? getVal(exifData.file['Image Width']) : '?'} x 
              {exifData.file?.['Image Height'] ? getVal(exifData.file['Image Height']) : '?'}
            </span>
          </div>
        </div>
      </div>

      {exifData.exif && Object.keys(exifData.exif).length > 0 && (
        <div className="raw-data-section">
          <h4>Raw EXIF Properties ({Object.keys(exifData.exif).length})</h4>
          <div className="raw-data-list">
            {Object.entries(exifData.exif).slice(0, 15).map(([key, val]) => (
              <div key={key} className="raw-row">
                <span className="raw-key">{key}</span>
                <span className="raw-val">{getVal(val)}</span>
              </div>
            ))}
            {Object.keys(exifData.exif).length > 15 && (
              <div className="raw-row"><span className="raw-val">...and more</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewExifView;
