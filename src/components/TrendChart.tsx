import React, { useState, useMemo, useRef } from 'react';
import type { Topic, EvidenceEvent } from '../types';
import { Activity, SlidersHorizontal } from 'lucide-react';

interface TrendChartProps {
  dates: string[];
  seriesData: Record<string, number[]>;
  selectedTopics: Topic[];
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

  // SVG dimensions
  const width = 860;
  const height = 360;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => {
    return padLeft + ((idx - startIndex) / Math.max(1, visibleCount - 1)) * plotW;
  };

  const getY = (val: number, maxVal = 100, minVal = 0) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padTop + plotH - ((clamped - minVal) / Math.max(1, maxVal - minVal)) * plotH;
  };

  // Compute velocity series
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

  // Milestone points
  const activeMilestones = useMemo(() => {
    const selectedIds = new Set(selectedTopics.map((t) => t.id));
    return events.filter((ev) => {
      const evDateIdx = dates.findIndex((d) => d === ev.date.slice(0, 7));
      if (evDateIdx < startIndex || evDateIdx > endIndex) return false;
      return ev.topics.some((tid) => selectedIds.has(tid));
    });
  }, [events, selectedTopics, dates, startIndex, endIndex]);

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
    <div className="workbench-card" ref={containerRef}>
      <div className="workbench-card-header">
        <div className="card-title-group">
          <span className="card-eyebrow-section">QUANTITATIVE EVIDENCE</span>
          <h3 className="card-title">Trajectory & Velocity Dynamics</h3>
          <p className="card-subtitle">
            Relative search volume normalized [0–100] relative to peak historical attention (2004–2026).
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
            title="Toggle between absolute normalized interest and monthly velocity derivative"
          >
            <Activity size={12} />
            <span>{isVelocityMode ? 'Velocity Derivative (Δ/Mo)' : 'Standard Curve [0–100]'}</span>
          </button>
        </div>
      </div>

      <div className="trend-chart-viewport">
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
                <stop offset="0%" stopColor={t.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={t.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
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
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  fill="var(--text-dim)"
                  fontSize="9.5"
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
                  <line x1={x} y1={padTop + plotH} x2={x} y2={padTop + plotH + 4} stroke="rgba(255,255,255,0.15)" />
                  <text
                    x={x}
                    y={height - 12}
                    fill="var(--text-dim)"
                    fontSize="10"
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

          {/* Curve Area & Paths */}
          {selectedTopics.map((topic) => {
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Milestone Event Pins directly on the curves */}
          {activeMilestones.map((ev) => {
            const evDateIdx = dates.findIndex((d) => d === ev.date.slice(0, 7));
            if (evDateIdx < startIndex || evDateIdx > endIndex) return null;

            const primaryTopic = selectedTopics.find((t) => ev.topics.includes(t.id)) || selectedTopics[0];
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
                <circle
                  cx={px}
                  cy={py}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#38bdf8' : '#0d1017'}
                  stroke={isSelected ? '#ffffff' : primaryTopic.color}
                  strokeWidth={isSelected ? '2' : '1.5'}
                />
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
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 2"
              />
              {selectedTopics.map((topic) => {
                const val = (processedSeries[topic.id] || [])[hoverIndex] || 0;
                const hx = getX(hoverIndex);
                const hy = getY(val, maxY, minY);
                return (
                  <circle
                    key={`hover-dot-${topic.id}`}
                    cx={hx}
                    cy={hy}
                    r={3.5}
                    fill={topic.color}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Live Hover Scrub Info Box */}
        <div className="chart-cursor-info-box">
          <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginBottom: '4px' }}>
            DATE: <strong style={{ color: '#fff' }}>{activeDate}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {selectedTopics.map((topic) => {
              const targetIdx = hoverIndex !== null ? hoverIndex : visibleDates.length - 1 + startIndex;
              const curVal = (processedSeries[topic.id] || [])[targetIdx] || 0;
              return (
                <div key={`info-${topic.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: topic.color }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>{topic.name}</span>
                  </div>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
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
