import React, { useState, useMemo } from 'react';
import type { Topic, TopicFeatures, KMeansExport } from '../types';
import { BarChart3 } from 'lucide-react';

interface ClusterStudioProps {
  topics: Topic[];
  kmeansData: KMeansExport;
  onSelectTopic: (topicId: string) => void;
}

export const ClusterStudio: React.FC<ClusterStudioProps> = ({
  topics,
  kmeansData,
  onSelectTopic
}) => {
  const [k, setK] = useState<number>(kmeansData.best_k || 4);
  const [axisMode, setAxisMode] = useState<'pca' | 'growth_volatility' | 'peak_persistence'>('pca');
  const [hoveredTopic, setHoveredTopic] = useState<(TopicFeatures & { name?: string; color?: string; cluster_idx?: number }) | null>(null);

  const clusterPalette = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#64748b'];

  const currentCentroids = useMemo(() => kmeansData.clusters_by_k[String(k)] || [], [kmeansData, k]);
  const currentAssignments = useMemo(() => kmeansData.assignments_by_k[String(k)] || [], [kmeansData, k]);
  const silhouette = kmeansData.silhouette_scores[String(k)] || 0;

  const topicsWithCluster = useMemo(() => {
    return kmeansData.topic_features.map((feat, idx) => {
      const topicObj = topics.find((t) => t.id === feat.topic_id);
      return {
        ...feat,
        name: topicObj?.name || feat.topic_id,
        color: topicObj?.color || '#ffffff',
        cluster_idx: currentAssignments[idx] ?? 0
      };
    });
  }, [kmeansData, topics, currentAssignments]);

  const plotWidth = 720;
  const plotHeight = 440;
  const padding = 50;

  const [minX, maxX, minY, maxY, labelX, labelY] = useMemo(() => {
    if (axisMode === 'pca') {
      return [-3.5, 3.5, -3.0, 3.0, 'Dimension 1 (Scale & Growth)', 'Dimension 2 (Changes & Longevity)'];
    } else if (axisMode === 'growth_volatility') {
      return [-30, 260, 0, 16, 'Growth Over Time (%)', 'Trend Changes (σ)'];
    } else {
      return [0, 105, 0, 270, 'Highest Interest (0–100)', 'How Long It Stayed Popular (Months)'];
    }
  }, [axisMode]);

  const getCoord = (tf: typeof topicsWithCluster[0]) => {
    let rawX = tf.pca_x;
    let rawY = tf.pca_y;

    if (axisMode === 'growth_volatility') {
      rawX = tf.cagr;
      rawY = tf.volatility;
    } else if (axisMode === 'peak_persistence') {
      rawX = tf.peak_intensity;
      rawY = tf.persistence_months;
    }

    const cx = padding + ((rawX - minX) / (maxX - minX)) * (plotWidth - padding * 2);
    const cy = padding + (plotHeight - padding * 2) - ((rawY - minY) / (maxY - minY)) * (plotHeight - padding * 2);
    return [Math.max(padding, Math.min(plotWidth - padding, cx)), Math.max(padding, Math.min(plotHeight - padding, cy))];
  };

  return (
    <div className="cluster-studio-container" role="main" aria-label="Technology Clustering Lab">
      {/* Parameter Control Header */}
      <div className="cluster-controls-banner">
        <div className="card-title-group">
          <span className="card-eyebrow-section">PATTERN ANALYSIS</span>
          <h2 className="card-title" style={{ fontSize: '17px' }}>
            Technology Cluster Lab
          </h2>
          <p className="card-subtitle">
            Grouping {topics.length} technologies by similar patterns over time.
          </p>
        </div>

        <div className="cluster-param-group">
          {/* K Cluster Slider */}
          <div className="k-slider-control">
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              Clusters (k): <strong style={{ color: '#fff' }}>{k}</strong>
            </span>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="k-slider-input"
            />
          </div>

          {/* Silhouette Score Badge */}
          <div className="silhouette-meter-badge" title="Cluster fit score (-1 to +1)">
            <BarChart3 size={13} color="var(--accent-cyan)" />
            <span>Score: <strong>{silhouette}</strong></span>
            {k === kmeansData.best_k && (
              <span style={{ color: 'var(--accent-emerald)', fontSize: '11px' }}>
                (Optimal)
              </span>
            )}
          </div>

          {/* Axis Selector */}
          <select
            value={axisMode}
            onChange={(e) => setAxisMode(e.target.value as any)}
            style={{
              padding: '5px 10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '5px',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}
          >
            <option value="pca">Main Patterns (PCA)</option>
            <option value="growth_volatility">Growth vs Trend Changes</option>
            <option value="peak_persistence">Highest Interest vs Duration</option>
          </select>
        </div>
      </div>

      <div className="cluster-studio-grid">
        {/* Left Side: 2D Feature Space Scatter Plot */}
        <div className="workbench-card">
          <div className="workbench-card-header">
            <div>
              <span className="card-eyebrow-section">DIMENSIONAL PROJECTION</span>
              <h3 className="card-title">{labelX} × {labelY}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Array.from({ length: k }).map((_, cIdx) => (
                <div key={`badge-c-${cIdx}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: clusterPalette[cIdx % clusterPalette.length] }}></span>
                  <span style={{ color: 'var(--text-dim)' }}>C{cIdx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="scatter-plot-canvas-box">
            <svg
              viewBox={`0 0 ${plotWidth} ${plotHeight}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {/* Axes lines */}
              <line
                x1={padding}
                y1={plotHeight - padding}
                x2={plotWidth - padding}
                y2={plotHeight - padding}
                stroke="rgba(255, 255, 255, 0.12)"
              />
              <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={plotHeight - padding}
                stroke="rgba(255, 255, 255, 0.12)"
              />

              {/* Axis Labels */}
              <text
                x={plotWidth / 2}
                y={plotHeight - 12}
                fill="var(--text-dim)"
                fontSize="11"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
              >
                {labelX}
              </text>
              <text
                x={16}
                y={plotHeight / 2}
                fill="var(--text-dim)"
                fontSize="11"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                transform={`rotate(-90 16 ${plotHeight / 2})`}
              >
                {labelY}
              </text>

              {/* Data points */}
              {topicsWithCluster.map((tf) => {
                const [cx, cy] = getCoord(tf);
                const clusterColor = clusterPalette[tf.cluster_idx % clusterPalette.length];
                const isHovered = hoveredTopic?.topic_id === tf.topic_id;

                return (
                  <g
                    key={`point-${tf.topic_id}`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredTopic(tf)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    onClick={() => onSelectTopic(tf.topic_id)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 7 : 4.5}
                      fill={clusterColor}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2 : 1}
                      fillOpacity={isHovered ? 1 : 0.85}
                    />
                    <text
                      x={cx + 8}
                      y={cy + 4}
                      fill={isHovered ? '#ffffff' : 'var(--text-muted)'}
                      fontSize={isHovered ? '11.5' : '10'}
                      fontWeight={isHovered ? '600' : '400'}
                      fontFamily="var(--font-sans)"
                      pointerEvents="none"
                    >
                      {tf.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredTopic && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  right: '14px',
                  background: 'rgba(13, 16, 23, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'var(--shadow-subtle)',
                  maxWidth: '260px',
                  zIndex: 30
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#ffffff', marginBottom: '6px' }}>
                  {hoveredTopic.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div>Growth: <strong style={{ color: 'var(--accent-emerald)' }}>+{hoveredTopic.cagr}%</strong></div>
                  <div>Changes: <strong>{hoveredTopic.volatility}σ</strong></div>
                  <div>Peak: <strong>{hoveredTopic.peak_intensity}/100</strong></div>
                  <div>Popular: <strong>{hoveredTopic.persistence_months}m</strong></div>
                  <div>Drop: <strong>{(hoveredTopic.decay_ratio * 100).toFixed(0)}%</strong></div>
                  <div>Spread: <strong>{hoveredTopic.entropy}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cluster Group Profile Cards */}
        <div className="archetype-cards-list">
          {currentCentroids.map((c, cIdx) => {
            const clusterColor = clusterPalette[cIdx % clusterPalette.length];
            const memberTopics = topicsWithCluster.filter((t) => t.cluster_idx === cIdx);

            return (
              <div key={`centroid-card-${cIdx}`} className="archetype-profile-card">
                <div className="archetype-title-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: clusterColor }}></span>
                    <span className="archetype-name">Pattern Group {cIdx + 1} ({memberTopics.length} Topics)</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                    Peak Avg: {c.peak_intensity.toFixed(0)}/100
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', margin: '6px 0' }}>
                  <div>Growth: <strong style={{ color: '#fff' }}>{c.cagr.toFixed(1)}%</strong></div>
                  <div>Changes: <strong style={{ color: '#fff' }}>{c.volatility.toFixed(1)}σ</strong></div>
                  <div>Popular: <strong style={{ color: '#fff' }}>{c.persistence_months.toFixed(0)}m</strong></div>
                </div>

                <div className="archetype-topic-pills">
                  {memberTopics.map((t) => (
                    <button
                      key={`topic-tag-${t.topic_id}`}
                      className="topic-chip-btn"
                      style={{ fontSize: '11px', padding: '2px 7px' }}
                      onClick={() => onSelectTopic(t.topic_id)}
                      title="Inspect in Investigation Deck"
                    >
                      <span className="topic-color-dot" style={{ backgroundColor: t.color }}></span>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
