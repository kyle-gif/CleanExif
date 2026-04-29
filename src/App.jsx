import React, { useState } from 'react';
import Dropzone from './components/Dropzone';
import Tabs from './components/Tabs';
import CleanExifView from './components/CleanExifView';
import ViewExifView from './components/ViewExifView';
import AdPlaceholder from './components/AdPlaceholder';
import { Shield } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('clean');

  const handleDropFile = (acceptedFile) => {
    setFile(acceptedFile);
    setActiveTab('clean');
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>CleanExif</h1>
        <p>100% Secure, Client-Side Photo Metadata Remover</p>
      </header>

      {!file && (
        <>
          <Dropzone onDropFile={handleDropFile} />
          <div style={{ marginTop: '24px' }}>
            <AdPlaceholder type="banner" />
          </div>
          
          <div className="glass-panel" style={{ marginTop: '24px', textAlign: 'center' }}>
            <Shield size={48} color="var(--primary-color)" style={{ marginBottom: '16px' }} />
            <h3>Why clean your EXIF data?</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
              Every photo you take contains hidden data (EXIF) including exact GPS coordinates, camera model, and time. 
              Before sharing photos online, remove this data to protect your privacy. Our tool runs completely in your browser — <strong>your photos never leave your device.</strong>
            </p>
          </div>
        </>
      )}

      {file && (
        <>
          <Tabs activeTab={activeTab} onChangeTab={setActiveTab} />
          
          {activeTab === 'clean' && <CleanExifView file={file} onClearFile={clearFile} />}
          {activeTab === 'view' && <ViewExifView file={file} />}
          {activeTab === 'support' && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
              <h2>Support Our Free Tool ♥</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                CleanExif is 100% free and runs locally to protect your privacy. 
                Please consider disabling your ad-blocker or clicking an ad below to help us maintain this project!
              </p>
              <AdPlaceholder type="banner" />
              <AdPlaceholder type="interstitial" />
              <AdPlaceholder type="banner" />
            </div>
          )}
          
          {activeTab !== 'support' && (
            <div style={{ marginTop: '24px' }}>
              <AdPlaceholder type="banner" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
