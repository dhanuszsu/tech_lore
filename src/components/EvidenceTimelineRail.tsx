import React, { useState, useEffect, useRef } from 'react';
import type { EvidenceEvent, CategoryBadge } from '../types';
import { ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface EvidenceTimelineRailProps {
  events: EvidenceEvent[];
  selectedBadge: CategoryBadge | 'all';
  activeYear: number | null;
  selectedEventId: string | null;
  onSelectEvent: (event: EvidenceEvent) => void;
  searchQuery: string;
}

export const EvidenceTimelineRail: React.FC<EvidenceTimelineRailProps> = ({
  events,
  selectedBadge,
  activeYear,
  selectedEventId,
  onSelectEvent,
  searchQuery
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(selectedEventId);
  const activeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEventId) {
      setExpandedId(selectedEventId);
      setTimeout(() => {
        activeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [selectedEventId]);

  const filteredEvents = events.filter((ev) => {
    if (selectedBadge !== 'all' && ev.category_badge !== selectedBadge) return false;
    if (activeYear !== null && ev.year !== activeYear) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchSummary = ev.summary.toLowerCase().includes(q);
      const matchSource = ev.source.toLowerCase().includes(q);
      const matchTopic = ev.topics.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchSource && !matchTopic) return false;
    }
    return true;
  });

  const yearsRepresented = Array.from(new Set(filteredEvents.map((e) => e.year))).sort((a, b) => b - a);

  return (
    <div className="workbench-right-pane" role="region" aria-label="Evidence Timeline Stream">
      <div className="timeline-rail-header">
        <div className="rail-section-name">HISTORICAL CONTEXT</div>
        <div className="rail-section-desc">
          Milestone Dossier ({filteredEvents.length} Verified Catalysts)
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={20} style={{ margin: '0 auto 8px auto', display: 'block' }} />
          No catalysts match the active filters. Try selecting another category or resetting the year scrubber.
        </div>
      ) : (
        <div className="timeline-entries-stream">
          {yearsRepresented.map((year) => {
            const yearEvents = filteredEvents.filter((e) => e.year === year);
            return (
              <React.Fragment key={`year-group-${year}`}>
                <div className="timeline-year-anchor">
                  <span className="timeline-year-pill">{year}</span>
                </div>

                {yearEvents.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  const isSelected = selectedEventId === ev.id;

                  const dateObj = new Date(ev.date);
                  const shortDate = isNaN(dateObj.getTime())
                    ? ev.date
                    : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div
                      key={ev.id}
                      ref={isSelected ? activeCardRef : null}
                      className={`timeline-card-node ${isSelected ? 'highlighted' : ''}`}
                      onClick={() => onSelectEvent(ev)}
                    >
                      <span className={`timeline-node-bullet ${isSelected ? 'active' : ''}`}></span>

                      <div className="timeline-card-title">{ev.title}</div>

                      <div className="timeline-card-meta-row">
                        <span className="badge-tag-pill">
                          {ev.category}
                        </span>
                        <span>•</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{shortDate}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--accent-cyan)' }}>{ev.delta_velocity}</span>

                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                          <button
                            style={{ color: 'var(--text-dim)', padding: '2px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(isExpanded ? null : ev.id);
                            }}
                            title="Expand evidence details"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Deep Evidence Details Drawer */}
                      {isExpanded && (
                        <div className="evidence-drawer-content">
                          <p style={{ lineHeight: 1.5, color: '#e2e8f0' }}>{ev.summary}</p>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Measurement:</span>
                            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                              {ev.delta_velocity}
                            </span>
                          </div>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Methodology:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{ev.methodology}</span>
                          </div>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Citation:</span>
                            <a
                              href={ev.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link-out"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>{ev.source}</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Grounding:</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                              {(ev.confidence * 100).toFixed(0)}% Empirical Confidence
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
