import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { Topic, EvidenceEvent } from '../types';
import { Activity, SlidersHorizontal } from 'lucide-react';

interface TrendChartProps {
  dates: string[];
  seriesData: Record<string, number[]>;
  selectedTopics: Topic[];
  primaryTopic: Topic;
  events: EvidenceEvent[];
  activeYear: number | null;
  onSelectEvent: (event: EvidenceEvent) => void;
  selectedEventId: string | null;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  dates,
  seriesData,
  selectedTopics,
  primaryTopic,
  events,
  activeYear,
  onSelectEvent,
  selectedEventId,
  onOpenFilters,
  activeFilterCount
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isVelocityMode, setIsVelocityMode] = useState<boolean>(false);

  const nPoints = dates.length;

  // Filter dates if activeYear is selected
  const [startIndex, endIndex] = useMemo(() => {
    if (!activeYear) return [0, nPoints - 1];
    let start = 0;
    let end = nPoints - 1;
    for (let i = 0; i < nPoints; i++) {
      if (dates[i].startsWith(String(activeYear))) {
        start = i;
        break;
      }
    }
    for (let i = nPoints - 1; i >= 0; i--) {
      if (dates[i].startsWith(String(activeYear))) {
        end = i;
        break;
      }
    }
    start = Math.max(0, start - 2);
    end = Math.min(nPoints - 1, end + 2);
    return [start, end];
  }, [dates, activeYear, nPoints]);

  const visibleDates = useMemo(() => dates.slice(startIndex, endIndex + 1), [dates, startIndex, endIndex]);
  const visibleCount = visibleDates.length;

  // Hero SVG Dimensions (640px height canvas)
  const width = 1200;
  const height = 640;
  const padLeft = 52;
  const padRight = 32;
  const padTop = 36;
  const padBottom = 48;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = useCallback(
    (idx: number) => {
      return padLeft + ((idx - startIndex) / Math.max(1, visibleCount - 1)) * plotW;
    },
    [startIndex, visibleCount, plotW]
  );

  const getY = useCallback(
    (val: number, maxVal = 100, minVal = 0) => {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      return padTop + plotH - ((clamped - minVal) / Math.max(1, maxVal - minVal)) * plotH;
    },
    [plotH]
  );

  // Compute processed series (standard interest vs monthly change)
  const processedSeries = useMemo(() => {
    const res: Record<string, number[]> = {};
    for (const t of selectedTopics) {
      const raw = seriesData[t.id] || [];
      if (!isVelocityMode) {
        res[t.id] = raw;
      } else {
        const vel = [0];
        for (let i = 1; i < raw.length; i++) {
          vel.push(Number((raw[i] - raw[i - 1]).toFixed(1)));
        }
        res[t.id] = vel;
      }
    }
    return res;
  }, [seriesData, selectedTopics, isVelocityMode]);

  const [minY, maxY] = useMemo(() => {
    if (!isVelocityMode) return [0, 100];
    let minV = 0;
    let maxV = 20;
    for (const t of selectedTopics) {
      const arr = (processedSeries[t.id] || []).slice(startIndex, endIndex + 1);
      for (const v of arr) {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    return [Math.floor(minV), Math.ceil(maxV)];
  }, [isVelocityMode, processedSeries, selectedTopics, startIndex, endIndex]);

  // Milestone points strictly filtered by primary focused topic
  const activeMilestones = useMemo(() => {
    return events.filter((ev) => {
      if (!ev.topics.includes(primaryTopic.id)) return false;
      const evDateIdx = dates.findIndex((d) => d === ev.date.slice(0, 7));
      if (evDateIdx < startIndex || evDateIdx > endIndex) return false;
      return true;
    });
  }, [events, primaryTopic.id, dates, startIndex, endIndex]);

  // Find currently selected event if any
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const selectedEventPoint = useMemo(() => {
    if (!selectedEvent) return null;
    const evDateIdx = dates.findIndex((d) => d === selectedEvent.date.slice(0, 7));
    if (evDateIdx < startIndex || evDateIdx > endIndex) return null;
    const px = getX(evDateIdx);
    const rawVal = (processedSeries[primaryTopic.id] || [])[evDateIdx] || 50;
    const py = getY(rawVal, maxY, minY);
    return { x: px, y: py, dateIdx: evDateIdx, event: selectedEvent };
  }, [selectedEvent, dates, startIndex, endIndex, processedSeries, primaryTopic.id, maxY, minY, getX, getY]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = (mouseX - padLeft) / plotW;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const targetIdx = startIndex + Math.round(clampedRatio * (visibleCount - 1));
    setHoverIndex(targetIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeDate = hoverIndex !== null ? dates[hoverIndex] : visibleDates[visibleDates.length - 1];

  return (
    <div className="workbench-card hero-graph-card" ref={containerRef}>
      <div className="workbench-card-header">
        <div className="card-title-group">
          <span className="card-eyebrow-section">{primaryTopic.name.toUpperCase()} · ATTENTION TRAJECTORY</span>
          <h3 className="card-title">Trajectory & Velocity Dynamics</h3>
          <p className="card-subtitle">
            Search interest scaled from 0 to 100 relative to highest historical point.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenFilters && (
            <button
              className="btn-quiet-action"
              onClick={onOpenFilters}
              style={{
                borderColor: activeFilterCount && activeFilterCount > 0 ? 'var(--accent-cyan)' : 'var(--border-hairline)',
                color: activeFilterCount && activeFilterCount > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)'
              }}
              title="Open category and evidence filters"
            >
              <SlidersHorizontal size={12} />
              <span>Filters</span>
              {activeFilterCount && activeFilterCount > 0 ? (
                <span className="btn-filter-counter">{activeFilterCount}</span>
              ) : null}
            </button>
          )}

          <button
            className="btn-quiet-action"
            onClick={() => setIsVelocityMode(!isVelocityMode)}
            style={{
              borderColor: isVelocityMode ? 'var(--accent-cyan)' : 'var(--border-hairline)',
              color: isVelocityMode ? 'var(--accent-cyan)' : 'var(--text-secondary)'
            }}
            title="Toggle between standard interest curve and rate of monthly change"
          >
            <Activity size={12} />
            <span>{isVelocityMode ? 'Monthly Change (Δ/Mo)' : 'Standard Curve [0–100]'}</span>
          </button>
        </div>
      </div>

      <div className="trend-chart-viewport hero-viewport">
        <svg
          className="chart-svg-layer"
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label="Interactive Search Trend Time Series Chart"
        >
          <defs>
            {selectedTopics.map((t) => (
              <linearGradient key={`grad-${t.id}`} id={`grad-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.color} stopOpacity={t.id === primaryTopic.id ? '0.28' : '0.12'} />
                <stop offset="100%" stopColor={t.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((level) => {
            const y = isVelocityMode
              ? padTop + (plotH / 4) * (4 - level / 25)
              : getY(level, maxY, minY);
            const labelVal = isVelocityMode ? Math.round(minY + (level / 100) * (maxY - minY)) : level;
            return (
              <g key={`grid-${level}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  fill="var(--text-dim)"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* X Axis Year Markers */}
          {dates.map((d, i) => {
            if (i < startIndex || i > endIndex) return null;
            if (d.endsWith('-01')) {
              const yr = d.split('-')[0];
              const x = getX(i);
              return (
                <g key={`x-tick-${d}`}>
                  <line x1={x} y1={padTop + plotH} x2={x} y2={padTop + plotH + 5} stroke="rgba(255,255,255,0.18)" />
                  <text
                    x={x}
                    y={height - 16}
                    fill="var(--text-dim)"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {yr}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* Highlight Line for Selected Catalyst */}
          {selectedEventPoint && (
            <g pointerEvents="none" className="catalyst-highlight-group">
              <line
                x1={selectedEventPoint.x}
                y1={padTop}
                x2={selectedEventPoint.x}
                y2={padTop + plotH}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <circle
                cx={selectedEventPoint.x}
                cy={selectedEventPoint.y}
                r="14"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.45"
                className="pulse-ring"
              />
              {/* Event title callout tag on chart */}
              <g transform={`translate(${Math.min(width - padRight - 160, Math.max(padLeft + 10, selectedEventPoint.x - 70))}, ${Math.max(padTop + 10, selectedEventPoint.y - 28)})`}>
                <rect
                  x="0"
                  y="0"
                  width="140"
                  height="20"
                  rx="4"
                  fill="rgba(15, 23, 42, 0.92)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
                <text
                  x="70"
                  y="13"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  {selectedEventPoint.event.date} · Catalyst
                </text>
              </g>
            </g>
          )}

          {/* Curve Area & Paths */}
          {/* Render non-primary overlay curves first, then primary focused topic on top */}
          {[
            ...selectedTopics.filter((t) => t.id !== primaryTopic.id),
            primaryTopic
          ].map((topic) => {
            const isPrimary = topic.id === primaryTopic.id;
            const raw = processedSeries[topic.id] || [];
            if (raw.length === 0) return null;

            let pathD = '';
            let areaD = '';

            for (let i = startIndex; i <= endIndex; i++) {
              const x = getX(i);
              const val = raw[i] !== undefined ? raw[i] : 0;
              const y = getY(val, maxY, minY);

              if (i === startIndex) {
                pathD += `M ${x} ${y}`;
                areaD += `M ${x} ${padTop + plotH} L ${x} ${y}`;
              } else {
                pathD += ` L ${x} ${y}`;
                areaD += ` L ${x} ${y}`;
              }

              if (i === endIndex) {
                areaD += ` L ${x} ${padTop + plotH} Z`;
              }
            }

            return (
              <g key={`curve-${topic.id}`}>
                <path d={areaD} fill={`url(#grad-${topic.id})`} />
                <path
                  d={pathD}
                  fill="none"
                  stroke={topic.color}
                  strokeWidth={isPrimary ? '3' : '1.8'}
                  strokeOpacity={isPrimary ? 1 : 0.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Milestone Event Pins strictly belonging to selected/focused topic */}
          {activeMilestones.map((ev) => {
            const evDateIdx = dates.findIndex((d) => d === ev.date.slice(0, 7));
            if (evDateIdx < startIndex || evDateIdx > endIndex) return null;

            const rawVal = (processedSeries[primaryTopic.id] || [])[evDateIdx] || 50;
            const px = getX(evDateIdx);
            const py = getY(rawVal, maxY, minY);
            const isSelected = selectedEventId === ev.id;

            return (
              <g
                key={`milestone-pin-${ev.id}`}
                className="chart-milestone-marker"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectEvent(ev)}
              >
                {isSelected ? (
                  <g>
                    <circle
                      cx={px}
                      cy={py}
                      r="9"
                      fill="rgba(56, 189, 248, 0.25)"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={px}
                      cy={py}
                      r="5"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                ) : (
                  <circle
                    cx={px}
                    cy={py}
                    r="4.5"
                    fill="#0b0e14"
                    stroke={primaryTopic.color}
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}

          {/* Hover Crosshair Cursor */}
          {hoverIndex !== null && hoverIndex >= startIndex && hoverIndex <= endIndex && (
            <g pointerEvents="none">
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={padTop + plotH}
                stroke="rgba(255, 255, 255, 0.35)"
                strokeDasharray="3 3"
              />
              {selectedTopics.map((topic) => {
                const val = (processedSeries[topic.id] || [])[hoverIndex] || 0;
                const hx = getX(hoverIndex);
                const hy = getY(val, maxY, minY);
                const isPrimary = topic.id === primaryTopic.id;
                return (
                  <circle
                    key={`hover-dot-${topic.id}`}
                    cx={hx}
                    cy={hy}
                    r={isPrimary ? 5 : 3.5}
                    fill={topic.color}
                    stroke="#ffffff"
                    strokeWidth={isPrimary ? '2' : '1.2'}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Live Hover Scrub Info Box */}
        <div className="chart-cursor-info-box">
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '5px' }}>
            DATE: <strong style={{ color: '#fff' }}>{activeDate}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedTopics.map((topic) => {
              const targetIdx = hoverIndex !== null ? hoverIndex : visibleDates.length - 1 + startIndex;
              const curVal = (processedSeries[topic.id] || [])[targetIdx] || 0;
              const isPrimary = topic.id === primaryTopic.id;
              return (
                <div key={`info-${topic.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: isPrimary ? '8px' : '6px', height: isPrimary ? '8px' : '6px', borderRadius: '50%', backgroundColor: topic.color }}></span>
                    <span style={{ color: isPrimary ? '#ffffff' : 'var(--text-secondary)', fontWeight: isPrimary ? 600 : 400 }}>
                      {topic.name} {isPrimary ? '●' : ''}
                    </span>
                  </div>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: isPrimary ? 'var(--accent-cyan)' : '#ffffff' }}>
                    {curVal}{isVelocityMode ? ' Δ' : ''}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
