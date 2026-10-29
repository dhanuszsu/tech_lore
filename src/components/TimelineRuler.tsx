import React from 'react';

interface TimelineRulerProps {
  years: number[];
  activeYear: number | null;
  onSelectYear: (year: number | null) => void;
  yearCounts: Record<number, number>;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  years,
  activeYear,
  onSelectYear,
  yearCounts
}) => {
  // Find max event count for relative density scaling
  const maxCount = Math.max(1, ...Object.values(yearCounts));

  return (
    <div className="archive-ruler-container" aria-label="Chronological Archive Ruler">
      <div className="archive-ruler-header">
        <div className="ruler-title-group">
          <span className="ruler-eyebrow">CHRONOLOGICAL SCRUB HORIZON</span>
          <span className="ruler-sub">2004 — 2026</span>
        </div>

        {activeYear ? (
          <button 
            className="ruler-reset-btn"
            onClick={() => onSelectYear(null)}
            title="Clear year filter"
          >
            <span>Viewing {activeYear} ({yearCounts[activeYear] || 0} catalysts)</span>
            <span className="reset-tag">· Reset Scope</span>
          </button>
        ) : (
          <span className="ruler-hint">Click any year to isolate historical epoch</span>
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

          return (
            <div
              key={year}
              className={`ruler-node ${isActive ? 'active' : ''} ${count > 0 ? 'has-events' : ''}`}
              onClick={() => onSelectYear(isActive ? null : year)}
              title={`${year}: ${count} verified catalysts recorded`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectYear(isActive ? null : year);
              }}
            >
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
