import React, { useState } from 'react';
import type { Topic } from '../types';

interface TopicIndexProps {
  topics: Topic[];
  selectedTopicIds: string[];
  primaryTopicId: string;
  onToggleTopic: (topicId: string) => void;
  onSetFocusTopic: (topicId: string) => void;
  onClearOverlays: () => void;
}

export const TopicIndex: React.FC<TopicIndexProps> = ({
  topics,
  selectedTopicIds,
  primaryTopicId,
  onToggleTopic,
  onSetFocusTopic,
  onClearOverlays
}) => {
  const [showLimitWarning, setShowLimitWarning] = useState<boolean>(false);

  const isAtLimit = selectedTopicIds.length >= 6;

  const handleItemClick = (topicId: string, isSelected: boolean, isFocused: boolean) => {
    if (!isSelected) {
      if (isAtLimit) {
        setShowLimitWarning(true);
        setTimeout(() => setShowLimitWarning(false), 3000);
      } else {
        onToggleTopic(topicId);
      }
    } else {
      // If already active:
      // Clicking the item changes focus to this topic (Section 5)
      if (!isFocused) {
        onSetFocusTopic(topicId);
      }
    }
  };

  const handleRemoveOverlay = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    onToggleTopic(topicId);
  };

  return (
    <section className="topic-index-section" aria-label="Curated Topic Archive Index">
      <div className="topic-index-header">
        <div className="index-title-group">
          <span className="index-eyebrow">TOPIC INDEX</span>
          <span className="index-count">
            <strong style={{ color: isAtLimit ? 'var(--accent-amber)' : '#ffffff' }}>
              {selectedTopicIds.length} / 6
            </strong> overlays
          </span>

          {selectedTopicIds.length > 1 && (
            <button
              className="index-clear-btn"
              onClick={onClearOverlays}
              title="Reset chart overlays to focused topic only"
            >
              · Clear overlays
            </button>
          )}

          {showLimitWarning && (
            <span className="index-limit-hint animate-fade">
              (6 / 6 overlays active · Remove one to compare another)
            </span>
          )}
        </div>

        <div className="index-meta-actions">
          <span className="index-instruction">
            Click to compare · Focus one for detail
          </span>

          <div className="index-legend" aria-hidden="true">
            <span className="legend-item">
              <span className="legend-dot active">●</span> ACTIVE
            </span>
            <span className="legend-item">
              <span className="legend-dot focus">◉</span> FOCUSED
            </span>
          </div>
        </div>
      </div>

      <div className="topic-index-grid" role="list">
        {topics.map((t, idx) => {
          const indexNum = String(idx + 1).padStart(2, '0');
          const isSelected = selectedTopicIds.includes(t.id);
          const isFocused = primaryTopicId === t.id;

          let stateClass = 'is-inactive';
          if (isFocused) {
            stateClass = 'is-focused';
          } else if (isSelected) {
            stateClass = 'is-active';
          }

          return (
            <div
              key={t.id}
              role="listitem"
              className={`topic-index-item ${stateClass}`}
              onClick={() => handleItemClick(t.id, isSelected, isFocused)}
              title={
                isFocused
                  ? `${t.name}: Currently Focused for detailed gauges`
                  : isSelected
                  ? `${t.name}: Active on chart (Click to focus · Click ✕ to remove)`
                  : `${t.name}: Click to add to chart overlays`
              }
            >
              {/* Archival Catalog Number */}
              <span className="topic-item-num">{indexNum}</span>

              {/* Minimal Color Signal Dot */}
              <span
                className="topic-item-dot"
                style={{
                  backgroundColor: t.color,
                  opacity: isSelected ? 1 : 0.35
                }}
              />

              {/* Topic Name */}
              <span className="topic-item-name">{t.name}</span>

              {/* Action Badges & Remove Triggers */}
              {isFocused ? (
                <div className="topic-badge-actions">
                  <span className="topic-state-tag focus" title="Driving detailed statistical measurements">
                    <span className="tag-symbol">◉</span> FOCUSED
                  </span>
                  {selectedTopicIds.length > 1 && (
                    <button
                      className="topic-remove-btn"
                      onClick={(e) => handleRemoveOverlay(e, t.id)}
                      title={`Remove ${t.name} from chart overlays`}
                      aria-label={`Remove ${t.name} from chart`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : isSelected ? (
                <div className="topic-badge-actions">
                  <button
                    className="topic-focus-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetFocusTopic(t.id);
                    }}
                    title="Focus for detailed measurements"
                  >
                    Focus
                  </button>
                  <button
                    className="topic-state-tag active"
                    onClick={(e) => handleRemoveOverlay(e, t.id)}
                    title="Click to remove from chart overlays"
                  >
                    <span>ACTIVE</span>
                    <span className="tag-close">✕</span>
                  </button>
                </div>
              ) : (
                <span className="topic-hover-hint">+ compare</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
