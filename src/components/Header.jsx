import React from 'react';

const Header = ({ onNavigate }) => (
  <header className="border-b border-leica-gray bg-leica-darkgray/80 backdrop-blur sticky top-0 z-40">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 group">
        <span className="w-4 h-4 bg-leica-red rounded-full ring-2 ring-leica-red/20 group-hover:ring-leica-red/40 transition-all"></span>
        <span className="text-xl font-bold text-white tracking-[0.2em] uppercase">CleanExif</span>
      </button>
      <nav className="flex items-center gap-1 sm:gap-2">
        <button onClick={() => onNavigate('home')} className="px-3 py-2 text-xs sm:text-sm text-leica-lightgray hover:text-white transition-colors">Tool</button>
        <button onClick={() => onNavigate('about')} className="px-3 py-2 text-xs sm:text-sm text-leica-lightgray hover:text-white transition-colors">About</button>
        <span className="hidden sm:block text-[11px] text-leica-lightgray tracking-widest uppercase border border-leica-gray rounded-full px-3 py-1 ml-2">
          100% Private
        </span>
      </nav>
    </div>
  </header>
);

export default Header;
