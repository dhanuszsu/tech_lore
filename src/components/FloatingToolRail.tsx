import React from 'react';
import { Moon, Home, GitMerge, FileCheck2 } from 'lucide-react';

interface FloatingToolRailProps {
  activeTab: 'workbench' | 'clustering' | 'provenance';
  setActiveTab: (tab: 'workbench' | 'clustering' | 'provenance') => void;
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
        data-tooltip="Editorial Dark Theme"
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
        data-tooltip="Investigation Workbench"
        aria-label="Investigation Workbench"
      >
        <Home size={16} />
      </button>

      <button
        className={`rail-tool-btn ${activeTab === 'clustering' ? 'active' : ''}`}
        onClick={() => setActiveTab('clustering')}
        data-tooltip="ML Cluster Studio"
        aria-label="ML Cluster Studio"
      >
        <GitMerge size={16} />
      </button>

      <button
        className={`rail-tool-btn ${activeTab === 'provenance' ? 'active' : ''}`}
        onClick={() => setActiveTab('provenance')}
        data-tooltip="Provenance & Methodology"
        aria-label="Provenance & Methodology"
      >
        <FileCheck2 size={16} />
      </button>
    </aside>
  );
};
