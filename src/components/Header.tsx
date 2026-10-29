import React from 'react';
import { Search, Compass, GitMerge, FileCheck2, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'workbench' | 'clustering' | 'provenance';
  setActiveTab: (tab: 'workbench' | 'clustering' | 'provenance') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onExport
}) => {
  return (
    <header className="top-nav">
      <div className="brand-group">
        <div className="brand-editorial-mark">
          <span className="brand-editorial-symbol">⌁</span>
          <span className="brand-editorial-text">TECH LORE</span>
          <span className="brand-sub-tag">/ 2004–2026 archive</span>
        </div>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-tab-btn ${activeTab === 'workbench' ? 'active' : ''}`}
          onClick={() => setActiveTab('workbench')}
        >
          <Compass size={14} />
          <span>Investigation Deck</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'clustering' ? 'active' : ''}`}
          onClick={() => setActiveTab('clustering')}
        >
          <GitMerge size={14} />
          <span>Cluster Lab</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'provenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('provenance')}
        >
          <FileCheck2 size={14} />
          <span>Methodology & Receipts</span>
        </button>
      </nav>

      <div className="header-actions">
        <div className="quick-search-box">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search topics, papers, catalysts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-quiet-action" onClick={onExport} title="Export verified dataset and analysis archive (JSON)">
          <Download size={12} />
          <span>Export Archive</span>
        </button>
      </div>
    </header>
  );
};
