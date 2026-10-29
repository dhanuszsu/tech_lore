import React, { useEffect } from 'react';
import type { CategoryBadge } from '../types';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBadge: CategoryBadge | 'all';
  onSelectBadge: (badge: CategoryBadge | 'all') => void;
  badgeCounts: Record<string, number>;
  activeYear: number | null;
  onSelectYear: (year: number | null) => void;
  totalEvents: number;
}

export const FiltersDrawer: React.FC<FiltersDrawerProps> = ({
  isOpen,
  onClose,
  selectedBadge,
  onSelectBadge,
  badgeCounts,
  activeYear,
  onSelectYear,
  totalEvents
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: Array<{
    id: CategoryBadge;
    label: string;
    dotClass: string;
    count: number;
  }> = [
    { id: 'yellow', label: 'Velocity Spikes', dotClass: 'dot-yellow', count: badgeCounts['yellow'] || 6 },
    { id: 'pink', label: 'Research Preprints', dotClass: 'dot-pink', count: badgeCounts['purple'] || 14 },
    { id: 'blue', label: 'Model Releases', dotClass: 'dot-blue', count: badgeCounts['blue'] || 12 },
    { id: 'red', label: 'Governance & Safety', dotClass: 'dot-red', count: badgeCounts['red'] || 5 },
    { id: 'green', label: 'Compute & Chips', dotClass: 'dot-green', count: badgeCounts['green'] || 4 },
    { id: 'cyan', label: 'Cultural Inflections', dotClass: 'dot-cyan', count: badgeCounts['cyan'] || 6 },
    { id: 'purple', label: 'Industry Shocks', dotClass: 'dot-purple', count: badgeCounts['magenta'] || 2 }
  ];

  const hasActiveFilters = selectedBadge !== 'all' || activeYear !== null;

  return (
    <div className="filters-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Investigation Filters">
      <div className="filters-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="filters-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={14} color="var(--accent-cyan)" />
            <span className="filters-drawer-title">INVESTIGATION FILTERS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasActiveFilters && (
              <button
                className="drawer-reset-btn"
                onClick={() => {
                  onSelectBadge('all');
                  onSelectYear(null);
                }}
                title="Reset all active filters"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
            <button className="drawer-close-btn" onClick={onClose} title="Close filters">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Category Filters Section */}
        <div className="drawer-section">
          <div className="drawer-section-title">EVIDENCE CATEGORY</div>
          <p className="drawer-section-desc">
            Filter chronological catalyst stream and milestone pins by historical evidence archetype.
          </p>

          <div className="drawer-categories-list">
            <button
              className={`drawer-cat-item ${selectedBadge === 'all' ? 'active' : ''}`}
              onClick={() => onSelectBadge('all')}
            >
              <span className="cat-bullet-all">●</span>
              <span className="cat-label">All Categories</span>
              <span className="cat-count">({totalEvents})</span>
            </button>

            {categories.map((cat) => {
              const isActive = selectedBadge === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`drawer-cat-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectBadge(isActive ? 'all' : cat.id)}
                >
                  <span className={`filter-dot-indicator ${cat.dotClass}`}></span>
                  <span className="cat-label">{cat.label}</span>
                  <span className="cat-count">({cat.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Temporal Year Filter Section */}
        <div className="drawer-section">
          <div className="drawer-section-title">TEMPORAL WINDOW</div>
          <div className="drawer-temporal-box">
            {activeYear ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', color: '#fff' }}>
                  Isolating Year: <strong>{activeYear}</strong>
                </span>
                <button
                  style={{ color: 'var(--accent-cyan)', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                  onClick={() => onSelectYear(null)}
                >
                  [Show 2004–2026]
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Full 22-year epoch active (2004–2026). Select any year in the horizontal scrubber above to isolate.
              </span>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="drawer-footer-note">
          Filter selections instantaneously constrain both the quantitative curve pins and the chronological evidence rail.
        </div>
      </div>
    </div>
  );
};
