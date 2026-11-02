import React, { useRef } from 'react';
import type { TopicHistoryProfile } from '../utils/topicHistory';

export interface LoreCardProps {
  profile: TopicHistoryProfile;
  isFocused: boolean;
  isActive: boolean;
  activeArchiveYear: number | null;
  onSelect: (topicId: string) => void;
  isSearchMatched?: boolean;
  hasSearchQuery?: boolean;
}

export const LoreCard: React.FC<LoreCardProps> = ({
  profile,
  isFocused,
  isActive,
  activeArchiveYear,
  onSelect,
  isSearchMatched = false,
  hasSearchQuery = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { topic, indexNumber, dateRange, catalystCount, catalystMarks, startPercent, accessibleSummary } = profile;

  const handleClick = () => {
    onSelect(topic.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(topic.id);
    }
  };

  // Check if this topic has any event or activity matching the active watermark year
  const isYearActiveInCard = activeArchiveYear !== null && profile.catalystYears.includes(activeArchiveYear);

  const searchClass = hasSearchQuery
    ? isSearchMatched
      ? 'is-search-matched'
      : 'is-search-dimmed'
    : '';

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      data-topic-id={topic.id}
      data-dominant-year={profile.dominantYear}
      className={`lore-card ${isFocused ? 'is-focused' : ''} ${isActive ? 'is-active' : ''} ${
        isYearActiveInCard ? 'is-temporal-highlight' : ''
      } ${searchClass}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${topic.name}, catalogue entry ${indexNumber}, ${dateRange}, ${catalystCount} ${
        catalystCount === 1 ? 'catalyst' : 'catalysts'
      }. Click to investigate on trend workbench.`}
    >
      {/* 1. Header: Catalog Number + Category */}
      <div className="lore-card-header">
        <span className="lore-card-num">{indexNumber}</span>
        <div className="lore-card-tags">
          {hasSearchQuery && isSearchMatched && (
            <span className="lore-card-state-tag search-match">
              MATCH
            </span>
          )}
          {isFocused ? (
            <span className="lore-card-state-tag focus" title="Currently driving detailed research measurements">
              <span className="tag-symbol">◉</span> FOCUSED
            </span>
          ) : isActive ? (
            <span className="lore-card-state-tag active" title="Active on comparison chart">
              <span className="tag-symbol">●</span> ACTIVE
            </span>
          ) : (
            <span className="lore-card-category">{topic.category}</span>
          )}
        </div>
      </div>

      {/* 2. Topic Name with color identity dot inside the title element */}
      <div className="lore-card-title-row">
        <h3 className="lore-card-title">
          <span
            className="lore-card-color-dot"
            style={{ backgroundColor: topic.color }}
            aria-hidden="true"
          />
          <span className="lore-card-title-text">{topic.name}</span>
        </h3>
      </div>

      {/* 3. Date Range & Catalyst Count */}
      <div className="lore-card-meta">
        <span className="lore-card-dates">{dateRange}</span>
        <span className="lore-card-catalysts">
          {catalystCount} {catalystCount === 1 ? 'CATALYST' : 'CATALYSTS'}
        </span>
      </div>

      {/* 4. Miniature Chronological Density Strip (Key Signature Feature) */}
      <div
        className="lore-density-strip"
        role="group"
        aria-label={`Chronological density strip: ${accessibleSummary}`}
      >
        <div className="density-strip-labels" aria-hidden="true">
          <span className="strip-year-label start">2004</span>
          <span className="strip-year-label end">2026</span>
        </div>

        <div className="density-strip-track" aria-hidden="true">
          {/* Baseline hairline timeline rule */}
          <div className="strip-baseline-line" />

          {/* Active Era span segment from introduction year to 2026 */}
          <div
            className="strip-active-span"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(4, 100 - startPercent)}%`,
              borderColor: topic.color
            }}
          />

          {/* Actual Data-Driven Catalyst Marks */}
          {catalystMarks.map((mark) => {
            const isMatch = activeArchiveYear === mark.year;
            return (
              <span
                key={mark.year}
                className={`density-mark ${mark.isClustered ? 'is-clustered' : ''} ${
                  isMatch ? 'is-year-matched' : ''
                }`}
                style={{
                  left: `${mark.percent}%`,
                  '--mark-color': topic.color
                } as React.CSSProperties}
                title={`${mark.count} verified catalyst${mark.count > 1 ? 's' : ''} in ${mark.year}`}
              >
                <span className="density-dot" />
                {mark.count >= 3 && <span className="density-dot stacked" />}
              </span>
            );
          })}

          {/* For topics with 0 catalysts (e.g. Expert Systems, SVM), show baseline peak mark */}
          {catalystCount === 0 && (
            <span
              className={`density-mark is-baseline-peak ${
                activeArchiveYear === profile.peakYear ? 'is-year-matched' : ''
              }`}
              style={{
                left: `${profile.startPercent}%`,
                '--mark-color': topic.color
              } as React.CSSProperties}
              title={`Historic era introduction: ${profile.startYear}`}
            >
              <span className="density-dot baseline" />
            </span>
          )}
        </div>
      </div>

      {/* 5. Authentic Descriptive Sentence (Restored Middle Content) */}
      <p className="lore-card-summary">
        {accessibleSummary}
      </p>

      {/* 6. Editorial Navigation Cue at bottom-right */}
      <div className="lore-card-footer">
        <span className="lore-card-view-cue">
          VIEW <span className="view-arrow" aria-hidden="true">→</span>
        </span>
      </div>
    </div>
  );
};
