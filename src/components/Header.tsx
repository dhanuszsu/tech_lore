import React from 'react';
import { Compass, GitMerge } from 'lucide-react';
import { ArchiveSearch } from './ArchiveSearch';
import type { Topic, EvidenceEvent } from '../types';

interface HeaderProps {
  activeTab: 'workbench' | 'clustering';
  setActiveTab: (tab: 'workbench' | 'clustering') => void;
  topics: Topic[];
  events: EvidenceEvent[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectEvent: (event: EvidenceEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  topics,
  events,
  searchQuery,
  setSearchQuery,
  onSelectTopic,
  onSelectEvent
}) => {
  const handleWorkbenchClick = () => {
    setActiveTab('workbench');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="top-nav">
      <div className="brand-group" onClick={handleWorkbenchClick} style={{ cursor: 'pointer' }}>
        <div className="brand-editorial-mark">
          <span className="brand-editorial-symbol">⌁</span>
          <span className="brand-editorial-text">TECH LORE</span>
          <span className="brand-sub-tag">/ 2004–2026 archive</span>
        </div>
      </div>

      <nav className="nav-links">
        <button
          className={`nav-tab-btn ${activeTab === 'workbench' ? 'active' : ''}`}
          onClick={handleWorkbenchClick}
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
      </nav>

      <div className="header-actions">
        {/* Real Functional Archive Search (Sections 13–20) */}
        <ArchiveSearch
          topics={topics}
          events={events}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectTopic={onSelectTopic}
          onSelectEvent={onSelectEvent}
        />
      </div>
    </header>
  );
};
