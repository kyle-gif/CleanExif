import React, { useState } from 'react';
import { Shield, Cpu, Zap, Coffee } from 'lucide-react';
import Dropzone from './components/Dropzone';
import Tabs from './components/Tabs';
import CleanExifView from './components/CleanExifView';
import ViewExifView from './components/ViewExifView';
import PhotoEditor from './components/PhotoEditor';
import AdPlaceholder from './components/AdPlaceholder';
import Articles from './components/Articles';
import Header from './components/Header';
import Footer from './components/Footer';
import { PrivacyPolicy, TermsOfService, AboutContact } from './components/InfoPages';

const FEATURES = [
  { icon: Shield, title: 'Total Privacy', text: 'Photos never leave your device. Everything runs in your browser.' },
  { icon: Cpu, title: 'Client-Side', text: 'No servers, no accounts, no logs. Works even offline.' },
  { icon: Zap, title: 'Instant & Free', text: 'View, wipe, or edit metadata in a single click — at no cost.' },
];

function App() {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [page, setPage] = useState('home');

  const navigate = (p) => {
    setPage(p);
    window.scrollTo({ top: 0 });
  };

  const handleDropFile = (acceptedFile) => {
    setFile(acceptedFile);
    setActiveTab('edit');
  };

  const clearFile = () => setFile(null);

  // ---- Static informational pages (Privacy / Terms / About) ----
  if (page !== 'home') {
    return (
      <div className="min-h-screen bg-leica-black flex flex-col">
        <Header onNavigate={navigate} />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
          {page === 'privacy' && <PrivacyPolicy onBack={() => navigate('home')} />}
          {page === 'terms' && <TermsOfService onBack={() => navigate('home')} />}
          {page === 'about' && <AboutContact onBack={() => navigate('home')} />}
        </main>
        <Footer onNavigate={navigate} />
      </div>
    );
  }

  // ---- Main tool ----
  return (
    <div className="min-h-screen bg-leica-black flex flex-col">
      <Header onNavigate={navigate} />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-8 flex flex-col xl:flex-row gap-8">

        {/* Center Main Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {!file && (
            <div className="flex flex-col gap-10 mt-2 mb-4">
              <div className="flex flex-col gap-5 items-center text-center">
                <span className="text-xs uppercase tracking-[0.25em] text-leica-red font-semibold">Privacy-First Photo Tool</span>
                <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                  Clean<span className="text-leica-red">Exif</span>
                </h2>
                <p className="text-lg text-leica-lightgray max-w-2xl leading-relaxed">
                  Free, secure, and 100% private EXIF metadata viewer, remover &amp; photo editor.
                  Your photos never leave your device.
                </p>
              </div>

              <div className="w-full max-w-2xl mx-auto">
                <Dropzone onDropFile={handleDropFile} />
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="panel flex flex-col gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-leica-black border border-leica-gray flex items-center justify-center">
                      <Icon className="text-leica-red" size={20} />
                    </div>
                    <h3 className="text-white font-semibold">{title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {file && (
            <>
              <Tabs activeTab={activeTab} onChangeTab={setActiveTab} />

              {activeTab === 'clean' && <CleanExifView file={file} onClearFile={clearFile} />}
              {activeTab === 'edit' && <PhotoEditor file={file} onClearFile={clearFile} />}
              {activeTab === 'view' && <ViewExifView file={file} />}
              {activeTab === 'support' && (
                <div className="panel flex flex-col gap-5 text-center items-center">
                  <Coffee className="text-leica-red" size={32} />
                  <h2 className="text-2xl font-bold text-white">Support This Free Tool</h2>
                  <p className="text-leica-lightgray max-w-lg leading-relaxed">
                    CleanExif is 100% free and private, with no accounts or paywalls. If it saved you
                    time, a small tip on Ko-fi helps cover hosting and keeps development going.
                  </p>
                  <a
                    href="https://ko-fi.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary px-8 py-3 text-base font-bold rounded-full my-2 inline-flex"
                  >
                    ☕ Buy me a Ko-fi
                  </a>
                </div>
              )}
            </>
          )}

          {/* SEO / informational article content */}
          <Articles />

          {/* A single in-content ad placed below substantial content */}
          <div className="mt-12">
            <AdPlaceholder type="banner" />
          </div>
        </div>

        {/* Right Sidebar (single sticky ad, only alongside the tool) */}
        {file && (
          <aside className="hidden xl:block w-[300px] shrink-0">
            <div className="sticky top-24">
              <AdPlaceholder type="interstitial" className="min-h-[600px]" />
            </div>
          </aside>
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default App;
