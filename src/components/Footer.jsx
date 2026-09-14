import React from 'react';
import { Lock, Cpu, Coffee } from 'lucide-react';

const Footer = ({ onNavigate }) => (
  <footer className="border-t border-leica-gray bg-leica-darkgray mt-auto">
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="col-span-2 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-leica-red rounded-full"></span>
          <span className="text-lg font-bold text-white tracking-[0.2em] uppercase">CleanExif</span>
        </div>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          A free, privacy-first photo metadata viewer and remover that runs entirely in your browser.
        </p>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-green-500" /> No uploads</span>
          <span className="inline-flex items-center gap-1.5"><Cpu size={13} className="text-green-500" /> Local only</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-1">Product</h4>
        <button onClick={() => onNavigate('home')} className="text-sm text-gray-500 hover:text-white text-left transition-colors">Tool</button>
        <button onClick={() => onNavigate('about')} className="text-sm text-gray-500 hover:text-white text-left transition-colors">About</button>
        <a href="https://ko-fi.com/" target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-white inline-flex items-center gap-1.5 transition-colors">
          <Coffee size={13} /> Support
        </a>
      </div>

      <div className="flex flex-col gap-2.5">
        <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-1">Legal</h4>
        <button onClick={() => onNavigate('privacy')} className="text-sm text-gray-500 hover:text-white text-left transition-colors">Privacy Policy</button>
        <button onClick={() => onNavigate('terms')} className="text-sm text-gray-500 hover:text-white text-left transition-colors">Terms of Service</button>
        <button onClick={() => onNavigate('about')} className="text-sm text-gray-500 hover:text-white text-left transition-colors">Contact</button>
      </div>
    </div>
    <div className="border-t border-leica-gray">
      <div className="max-w-6xl mx-auto px-4 py-5 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} CleanExif. 100% Local Processing. No trackers on your photos.
      </div>
    </div>
  </footer>
);

export default Footer;
