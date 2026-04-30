import React from 'react';

const Tabs = ({ activeTab, onChangeTab }) => {
  return (
    <div className="flex gap-2 bg-leica-darkgray p-1 rounded-lg border border-leica-gray w-full max-w-md mx-auto mb-6">
      <button 
        className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-200 ${activeTab === 'clean' ? 'bg-leica-gray text-white shadow' : 'text-leica-lightgray hover:text-white'}`}
        onClick={() => onChangeTab('clean')}
      >
        EXIF Cleaner
      </button>
      <button 
        className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-200 ${activeTab === 'edit' ? 'bg-leica-gray text-white shadow' : 'text-leica-lightgray hover:text-white'}`}
        onClick={() => onChangeTab('edit')}
      >
        RAW Editor
      </button>
      <button 
        className={`flex-1 py-2 text-sm font-medium rounded transition-all duration-200 ${activeTab === 'support' ? 'bg-leica-red text-white shadow' : 'text-red-500 hover:text-red-400'}`}
        onClick={() => onChangeTab('support')}
      >
        Support Us
      </button>
    </div>
  );
};

export default Tabs;
