import React, { useState } from 'react';
import Dropzone from './components/Dropzone';
import Tabs from './components/Tabs';
import CleanExifView from './components/CleanExifView';
import ViewExifView from './components/ViewExifView';
import PhotoEditor from './components/PhotoEditor';
import AdPlaceholder from './components/AdPlaceholder';
import Articles from './components/Articles';

function App() {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('edit');

  const handleDropFile = (acceptedFile) => {
    setFile(acceptedFile);
    setActiveTab('edit');
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-leica-black flex flex-col">
      {/* Navbar / Header */}
      <header className="border-b border-leica-gray bg-leica-darkgray py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-leica-red rounded-full"></div>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">CleanExif</h1>
          </div>
          <p className="hidden md:block text-xs text-leica-lightgray tracking-widest uppercase">
            Private Photo Editor
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-8 flex flex-col xl:flex-row gap-8">
        
        {/* Left Sidebar (Ad Space) - Hidden on smaller screens */}
        <div className="hidden xl:flex w-[250px] flex-col gap-6 shrink-0">
          <div className="sticky top-6 flex flex-col gap-6">
            <AdPlaceholder type="interstitial" className="min-h-[600px]" />
          </div>
        </div>

        {/* Center Main Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {!file && (
            <div className="flex flex-col gap-6">
              <Dropzone onDropFile={handleDropFile} />
              <AdPlaceholder type="banner" />
            </div>
          )}

          {file && (
            <>
              <Tabs activeTab={activeTab} onChangeTab={setActiveTab} />
              
              {activeTab === 'clean' && <CleanExifView file={file} onClearFile={clearFile} />}
              {activeTab === 'edit' && <PhotoEditor file={file} onClearFile={clearFile} />}
              {activeTab === 'view' && <ViewExifView file={file} />}
              {activeTab === 'support' && (
                <div className="panel flex flex-col gap-6 text-center">
                  <h2 className="text-2xl font-bold text-white">Support Our Free Tool</h2>
                  <p className="text-leica-lightgray">
                    CleanExif is 100% free and private. Please consider clicking an ad below to help us maintain the servers (even if there are none for the app!).
                  </p>
                  <AdPlaceholder type="banner" />
                  <AdPlaceholder type="interstitial" />
                  <AdPlaceholder type="banner" />
                </div>
              )}
              
              {activeTab !== 'support' && (
                <div className="mt-8">
                  <AdPlaceholder type="banner" />
                </div>
              )}
            </>
          )}

          {/* SEO Articles at the bottom of the main column */}
          <Articles />
        </div>

        {/* Right Sidebar (Ad Space) */}
        <div className="w-full xl:w-[250px] flex flex-col gap-6 shrink-0">
          <div className="sticky top-6 flex flex-col gap-6">
            <AdPlaceholder type="interstitial" className="min-h-[600px]" />
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-leica-gray bg-leica-darkgray py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} CleanExif. 100% Local Processing. No trackers.
        </div>
      </footer>
    </div>
  );
}

export default App;
