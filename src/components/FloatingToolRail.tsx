import React from 'react';
import { Moon, Home, GitMerge } from 'lucide-react';

interface FloatingToolRailProps {
  activeTab: 'workbench' | 'clustering';
  setActiveTab: (tab: 'workbench' | 'clustering') => void;
  onResetView: () => void;
}

export const FloatingToolRail: React.FC<FloatingToolRailProps> = ({
  activeTab,
  setActiveTab,
  onResetView
}) => {
  return (
    <aside className="floating-action-rail" aria-label="Quick Action Toolbar">
      <button
        className="rail-tool-btn"
        onClick={() => {}}
        data-tooltip="Dark Theme"
        aria-label="Toggle Theme"
      >
        <Moon size={16} />
      </button>

      <button
        className={`rail-tool-btn ${activeTab === 'workbench' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('workbench');
          onResetView();
        }}
        data-tooltip="Investigation Deck"
        aria-label="Investigation Deck"
      >
        <Home size={16} />
      </button>

      <button
        className={`rail-tool-btn ${activeTab === 'clustering' ? 'active' : ''}`}
        onClick={() => setActiveTab('clustering')}
        data-tooltip="Cluster Lab"
        aria-label="Cluster Lab"
      >
        <GitMerge size={16} />
      </button>
    </aside>
  );
};
