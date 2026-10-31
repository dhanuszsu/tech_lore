import React, { useMemo } from 'react';
import type { Topic } from '../types';

interface TimelineRulerProps {
  years: number[];
  activeYear: number | null;
  onSelectYear: (year: number | null) => void;
  yearCounts: Record<number, number>;
  topics?: Topic[];
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  years,
  activeYear,
  onSelectYear,
  yearCounts,
  topics = []
}) => {
  // Find max event count for relative density scaling
  const maxCount = Math.max(1, ...Object.values(yearCounts));

  // Map topics to their introduction year based on canonical topic metadata
  const topicsByYear = useMemo(() => {
    const map: Record<number, Topic[]> = {};
    for (const t of topics) {
      if (!t.introduced) continue;
      const yr = parseInt(t.introduced.slice(0, 4), 10);
      if (!isNaN(yr)) {
        if (!map[yr]) map[yr] = [];
        map[yr].push(t);
      }
    }
    return map;
  }, [topics]);

  return (
    <div className="archive-ruler-container" aria-label="Chronological Archive Ruler">
      <div className="archive-ruler-header">
        <div className="ruler-title-group">
          <span className="ruler-eyebrow">HISTORICAL TIMELINE</span>
          <span className="ruler-sub">2004 — 2026</span>
        </div>

        {activeYear ? (
          <button 
            className="ruler-reset-btn"
            onClick={() => onSelectYear(null)}
            title="Clear year filter"
          >
            <span>Viewing {activeYear} ({yearCounts[activeYear] || 0} catalysts)</span>
            <span className="reset-tag">· Show All Years</span>
          </button>
        ) : (
          <span className="ruler-hint">Click any year to filter timeline</span>
        )}
      </div>

      {/* Scrubber Ruler with continuous baseline and vertical density signals */}
      <div className="archive-ruler-track">
        {/* Continuous baseline running across all years */}
        <div className="ruler-continuous-baseline" aria-hidden="true" />

        {years.map((year) => {
          const count = yearCounts[year] || 0;
          const isActive = activeYear === year;
          const densityRatio = count / maxCount;
          // Calculate density marker height (4px to 18px)
          const barHeight = count > 0 ? Math.max(4, Math.round(densityRatio * 18)) : 2;
          const yearTopics = topicsByYear[year] || [];

          return (
            <div
              key={year}
              className={`ruler-node ${isActive ? 'active' : ''} ${count > 0 ? 'has-events' : ''} ${yearTopics.length > 0 ? 'has-topics' : ''}`}
              onClick={() => onSelectYear(isActive ? null : year)}
              title={`${year}: ${count} verified catalysts recorded${yearTopics.length > 0 ? ` · Topics: ${yearTopics.map((t) => t.name).join(', ')}` : ''}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectYear(isActive ? null : year);
              }}
            >
              {/* Topic Marker Layer: COLORED DOT → TOPIC NAME */}
              {yearTopics.length > 0 && (
                <div
                  className={`ruler-topic-layer ${year === 2004 ? 'grid-layout' : ''} ${year === 2018 ? 'tier-elevated' : ''}`}
                  onClick={(e) => {
                    // Selecting topic also activates the corresponding year epoch
                    e.stopPropagation();
                    onSelectYear(isActive ? null : year);
                  }}
                >
                  {yearTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="ruler-topic-marker"
                      title={`${topic.name} (Introduced: ${topic.introduced})`}
                    >
                      <span
                        className="ruler-topic-dot"
                        style={{ backgroundColor: topic.color }}
                        aria-hidden="true"
                      />
                      <span className="ruler-topic-name">{topic.name}</span>
                    </div>
                  ))}
                  {/* Vertical hairline connector for elevated tier to prevent overlap */}
                  {year === 2018 && <div className="ruler-tier-connector" aria-hidden="true" />}
                </div>
              )}

              {/* Density signal indicator above baseline */}
              <div className="ruler-density-wrapper">
                {count > 0 ? (
                  <span 
                    className="ruler-density-bar" 
                    style={{ height: `${barHeight}px` }} 
                  />
                ) : (
                  <span className="ruler-density-dot-quiet" />
                )}
              </div>

              {/* Tick marker touching baseline */}
              <div className={`ruler-tick-mark ${count > 0 ? 'prominent' : ''}`} />

              {/* Year Label */}
              <div className="ruler-year-text">{year}</div>

              {/* Event Count underneath */}
              <div className="ruler-count-caption">
                {count > 0 ? `${count}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
