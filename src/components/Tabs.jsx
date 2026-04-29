import React from 'react';
import './Tabs.css';

const Tabs = ({ activeTab, onChangeTab }) => {
  return (
    <div className="tabs-container">
      <button 
        className={`tab-btn ${activeTab === 'clean' ? 'active' : ''}`}
        onClick={() => onChangeTab('clean')}
      >
        Clean Exif
      </button>
      <button 
        className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
        onClick={() => onChangeTab('view')}
      >
        View Exif
      </button>
      <button 
        className={`tab-btn premium-tab ${activeTab === 'support' ? 'active' : ''}`}
        onClick={() => onChangeTab('support')}
        style={{ color: activeTab === 'support' ? '#e91e63' : 'var(--text-secondary)' }}
      >
        Support Us ♥
      </button>
    </div>
  );
};

export default Tabs;
