import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Topic, EvidenceEvent, CategoryBadge } from '../types';
import { ExternalLink, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface EvidenceTimelineRailProps {
  primaryTopic: Topic;
  events: EvidenceEvent[];
  selectedBadge: CategoryBadge | 'all';
  activeYear: number | null;
  selectedEventId: string | null;
  onSelectEvent: (event: EvidenceEvent) => void;
  searchQuery: string;
}

export const EvidenceTimelineRail: React.FC<EvidenceTimelineRailProps> = ({
  primaryTopic,
  events,
  selectedBadge,
  activeYear,
  selectedEventId,
  onSelectEvent,
  searchQuery
}) => {
  const [toggledId, setToggledId] = useState<string | null>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Active expanded ID is either the explicitly toggled card or the selectedEventId
  const expandedId = toggledId === '__none__' ? null : (toggledId ?? selectedEventId);

  // Scroll active card into view when selected
  useEffect(() => {
    if (selectedEventId) {
      const timer = setTimeout(() => {
        activeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedEventId]);

  // Strictly filter events to the focused topic
  const topicEvents = useMemo(() => {
    return events.filter((ev) => ev.topics.includes(primaryTopic.id));
  }, [events, primaryTopic.id]);

  const filteredEvents = useMemo(() => {
    return topicEvents.filter((ev) => {
      if (selectedBadge !== 'all' && ev.category_badge !== selectedBadge) return false;
      if (activeYear !== null && ev.year !== activeYear) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchSummary = ev.summary.toLowerCase().includes(q);
        const matchSource = ev.source.toLowerCase().includes(q);
        return matchTitle || matchSummary || matchSource;
      }
      return true;
    });
  }, [topicEvents, selectedBadge, activeYear, searchQuery]);

  const yearsRepresented = useMemo(() => {
    return Array.from(new Set(filteredEvents.map((e) => e.year))).sort((a, b) => b - a);
  }, [filteredEvents]);

  return (
    <div className="workbench-right-pane" role="region" aria-label="Evidence Timeline Stream">
      {/* Dynamic topic-specific evidence header */}
      <div className="timeline-rail-header">
        <div className="rail-section-name">{primaryTopic.name.toUpperCase()} · CATALYSTS</div>
        <div className="rail-section-desc">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'CATALYST' : 'CATALYSTS'}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="timeline-empty-state" style={{ padding: '36px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={22} style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--text-dim)' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: '#ffffff', marginBottom: '6px' }}>
            NO DIRECT CATALYSTS IN CURRENT CORPUS
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '280px', margin: '0 auto', lineHeight: '1.45' }}>
            No specific historical milestones are recorded for {primaryTopic.name} in this observation window.
          </div>
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
                      onClick={() => {
                        onSelectEvent(ev);
                        setToggledId(ev.id);
                      }}
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
                            style={{ color: 'var(--text-dim)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setToggledId(isExpanded ? '__none__' : ev.id);
                            }}
                            title="Expand evidence details"
                            aria-label="Expand catalyst details"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Evidence Details */}
                      {isExpanded && (
                        <div className="evidence-drawer-content">
                          <p style={{ lineHeight: 1.5, color: '#e2e8f0', margin: '0 0 10px 0' }}>{ev.summary}</p>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Impact on Trend:</span>
                            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                              {ev.delta_velocity}
                            </span>
                          </div>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Details:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{ev.methodology}</span>
                          </div>

                          <div className="evidence-fact-row">
                            <span className="evidence-fact-label">Source:</span>
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
                            <span className="evidence-fact-label">Confidence:</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                              {(ev.confidence * 100).toFixed(0)}%
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
