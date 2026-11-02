import React, { useState, useMemo } from 'react';
import type { Topic, TopicFeatures, KMeansExport } from '../types';
import { BarChart3, GitCompare, ArrowRight, SlidersHorizontal } from 'lucide-react';

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
  const [k, setK] = useState<number>(kmeansData.best_k || 5);
  const [axisMode, setAxisMode] = useState<'pca' | 'growth_volatility' | 'peak_persistence'>('pca');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('large_language_models');
  const [compareTopicId, setCompareTopicId] = useState<string | null>('generative_ai');
  const [hoveredTopic, setHoveredTopic] = useState<(TopicFeatures & { name?: string; color?: string; cluster_idx?: number }) | null>(null);

  const clusterPalette = ['#ff66b8', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#64748b'];

  const currentCentroids = useMemo(() => kmeansData.clusters_by_k[String(k)] || [], [kmeansData, k]);
  const currentAssignments = useMemo(() => kmeansData.assignments_by_k[String(k)] || [], [kmeansData, k]);
  const silhouette = kmeansData.silhouette_scores[String(k)] || 0;

  // Map each topic with cluster index and authentic metadata
  const topicsWithCluster = useMemo(() => {
    return kmeansData.topic_features.map((feat, idx) => {
      const topicObj = topics.find((t) => t.id === feat.topic_id);
      return {
        ...feat,
        name: topicObj?.name || feat.topic_id,
        color: topicObj?.color || '#ffffff',
        category: topicObj?.category || 'General',
        introduced: topicObj?.introduced || '2004',
        cluster_idx: currentAssignments[idx] ?? 0
      };
    });
  }, [kmeansData, topics, currentAssignments]);

  // Primary selected topic
  const primaryTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || topics[0];
  }, [topics, selectedTopicId]);

  const primaryWithCluster = useMemo(() => {
    return topicsWithCluster.find((t) => t.topic_id === primaryTopic.id) || topicsWithCluster[0];
  }, [topicsWithCluster, primaryTopic]);

  // Secondary comparison topic (optional)
  const compareTopic = useMemo(() => {
    if (!compareTopicId || compareTopicId === selectedTopicId) return null;
    return topics.find((t) => t.id === compareTopicId) || null;
  }, [topics, compareTopicId, selectedTopicId]);

  const compareWithCluster = useMemo(() => {
    if (!compareTopic) return null;
    return topicsWithCluster.find((t) => t.topic_id === compareTopic.id) || null;
  }, [topicsWithCluster, compareTopic]);

  // Peer topics in the exact same cluster
  const peerTopics = useMemo(() => {
    return topicsWithCluster.filter(
      (t) => t.cluster_idx === primaryWithCluster.cluster_idx && t.topic_id !== primaryTopic.id
    );
  }, [topicsWithCluster, primaryWithCluster, primaryTopic]);

  // Primary cluster centroid
  const primaryCentroid = useMemo(() => {
    return currentCentroids[primaryWithCluster.cluster_idx] || currentCentroids[0];
  }, [currentCentroids, primaryWithCluster]);

  const plotWidth = 720;
  const plotHeight = 460;
  const padding = 54;

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
    return [
      Math.max(padding, Math.min(plotWidth - padding, cx)),
      Math.max(padding, Math.min(plotHeight - padding, cy))
    ];
  };

  const handleTopicTabClick = (topicId: string) => {
    if (selectedTopicId === topicId) return;
    // Set as primary topic
    setSelectedTopicId(topicId);
    // If the new primary matches comparison, clear comparison
    if (compareTopicId === topicId) {
      setCompareTopicId(null);
    }
  };

  // Coordinates for primary and comparison topics for connector line
  const primaryCoord = getCoord(primaryWithCluster);
  const compareCoord = compareWithCluster ? getCoord(compareWithCluster) : null;

  // Euclidean distance between primary and compare in feature space
  const featureDistance = useMemo(() => {
    if (!compareWithCluster) return null;
    const dx = primaryWithCluster.pca_x - compareWithCluster.pca_x;
    const dy = primaryWithCluster.pca_y - compareWithCluster.pca_y;
    return Math.sqrt(dx * dx + dy * dy).toFixed(2);
  }, [primaryWithCluster, compareWithCluster]);

  return (
    <div className="cluster-studio-container" role="main" aria-label="Technology Clustering Lab">
      {/* 1. Header Banner & Workspace Controls */}
      <div className="cluster-controls-banner">
        <div className="card-title-group">
          <span className="card-eyebrow-section">PATTERN ANALYSIS · MULTIDIMENSIONAL PROJECTION</span>
          <h2 className="card-title" style={{ fontSize: '18px' }}>
            Technology Cluster Lab
          </h2>
          <p className="card-subtitle">
            Grouping {topics.length} technologies by mathematical behavior, velocity, and longevity in standardized feature space.
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
              aria-label="Number of clusters"
            />
          </div>

          {/* Silhouette Score Badge */}
          <div className="silhouette-meter-badge" title="Silhouette Diagnostic evaluates mathematical separation (-1 to +1)">
            <BarChart3 size={13} color="var(--accent-pink)" />
            <span>Score: <strong>{silhouette}</strong></span>
            {k === kmeansData.best_k && (
              <span style={{ color: 'var(--accent-emerald)', fontSize: '11px', fontWeight: 600 }}>
                (Optimal)
              </span>
            )}
          </div>

          {/* Axis Selector */}
          <select
            value={axisMode}
            onChange={(e) => setAxisMode(e.target.value as any)}
            className="cluster-axis-select"
            aria-label="Projection axis mode"
          >
            <option value="pca">Main Patterns (PCA Projection)</option>
            <option value="growth_volatility">Growth (CAGR) vs Trend Changes (σ)</option>
            <option value="peak_persistence">Highest Interest vs Duration (Months)</option>
          </select>
        </div>
      </div>

      {/* 2. TOPIC COMPARISON & SELECTION TABS */}
      <div className="cluster-topic-selection-section" role="region" aria-label="Topic Selection & Comparison">
        <div className="cluster-topic-selection-header">
          <div className="selection-header-title-group">
            <span className="selection-eyebrow">TOPIC COMPARISON SELECTOR</span>
            <span className="selection-hint">
              Select any technology to inspect multidimensional coordinates and compare trajectories
            </span>
          </div>

          {compareTopicId && (
            <button
              className="cluster-clear-compare-btn"
              onClick={() => setCompareTopicId(null)}
              title="Clear comparison topic"
            >
              · Clear Comparison ({compareTopic?.name})
            </button>
          )}
        </div>

        {/* Visible Topic Tabs with Full Names */}
        <div className="cluster-topic-tabs-scroll" role="tablist">
          {topics.map((t) => {
            const isSelected = selectedTopicId === t.id;
            const isComparing = compareTopicId === t.id;
            const itemWithCluster = topicsWithCluster.find((item) => item.topic_id === t.id);
            const clusterIdx = itemWithCluster?.cluster_idx ?? 0;
            const clusterColor = clusterPalette[clusterIdx % clusterPalette.length];

            return (
              <button
                key={`cluster-tab-${t.id}`}
                role="tab"
                aria-selected={isSelected || isComparing}
                className={`cluster-topic-tab-pill ${isSelected ? 'is-selected' : ''} ${isComparing ? 'is-comparing' : ''}`}
                onClick={() => handleTopicTabClick(t.id)}
                title={`${t.name} (Cluster C${clusterIdx + 1}) — Click to inspect`}
              >
                <span className="tab-pill-name">
                  <span
                    className="tab-pill-dot"
                    style={{ backgroundColor: t.color }}
                    aria-hidden="true"
                  />
                  <span className="tab-pill-text">{t.name}</span>
                </span>
                <span
                  className="tab-pill-cluster"
                  style={{
                    color: clusterColor,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${clusterColor}`
                  }}
                >
                  C{clusterIdx + 1}
                </span>
                {isSelected && <span className="tab-pill-badge">INSPECTING</span>}
                {isComparing && <span className="tab-pill-badge compare">COMPARING</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TWO-COLUMN WORKSPACE: LEFT (62% PCA PLOT) | RIGHT (38% COMPARISON & DETAILS) */}
      <div className="cluster-studio-grid">
        {/* LEFT COLUMN: 2D Feature Space Scatter Plot */}
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
              {/* Gridlines */}
              <line
                x1={padding}
                y1={plotHeight / 2}
                x2={plotWidth - padding}
                y2={plotHeight / 2}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />
              <line
                x1={plotWidth / 2}
                y1={padding}
                x2={plotWidth / 2}
                y2={plotHeight - padding}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />

              {/* Axes lines */}
              <line
                x1={padding}
                y1={plotHeight - padding}
                x2={plotWidth - padding}
                y2={plotHeight - padding}
                stroke="rgba(255, 255, 255, 0.15)"
              />
              <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={plotHeight - padding}
                stroke="rgba(255, 255, 255, 0.15)"
              />

              {/* Axis Labels */}
              <text
                x={plotWidth / 2}
                y={plotHeight - 14}
                fill="var(--text-secondary)"
                fontSize="11"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
              >
                {labelX}
              </text>
              <text
                x={18}
                y={plotHeight / 2}
                fill="var(--text-secondary)"
                fontSize="11"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                transform={`rotate(-90 18 ${plotHeight / 2})`}
              >
                {labelY}
              </text>

              {/* Connector line between compared topics */}
              {compareCoord && (
                <g pointerEvents="none">
                  <line
                    x1={primaryCoord[0]}
                    y1={primaryCoord[1]}
                    x2={compareCoord[0]}
                    y2={compareCoord[1]}
                    stroke="#ff66b8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />
                  {/* Midpoint distance badge */}
                  <rect
                    x={(primaryCoord[0] + compareCoord[0]) / 2 - 28}
                    y={(primaryCoord[1] + compareCoord[1]) / 2 - 10}
                    width="56"
                    height="18"
                    rx="3"
                    fill="rgba(11, 14, 20, 0.9)"
                    stroke="var(--border-hairline)"
                  />
                  <text
                    x={(primaryCoord[0] + compareCoord[0]) / 2}
                    y={(primaryCoord[1] + compareCoord[1]) / 2 + 3}
                    fill="#ff66b8"
                    fontSize="9.5"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    Δ {featureDistance}
                  </text>
                </g>
              )}

              {/* Data points */}
              {topicsWithCluster.map((tf) => {
                const [cx, cy] = getCoord(tf);
                const clusterColor = clusterPalette[tf.cluster_idx % clusterPalette.length];
                const isPrimary = tf.topic_id === primaryTopic.id;
                const isCompare = tf.topic_id === compareTopic?.id;
                const isHovered = hoveredTopic?.topic_id === tf.topic_id;

                return (
                  <g
                    key={`point-${tf.topic_id}`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredTopic(tf)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    onClick={() => handleTopicTabClick(tf.topic_id)}
                  >
                    {/* Pulsing ring for primary selected topic */}
                    {isPrimary && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={12}
                        fill="none"
                        stroke="var(--accent-pink)"
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="pulse-ring"
                      />
                    )}

                    {/* Secondary ring for compare topic */}
                    {isCompare && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        opacity="0.75"
                      />
                    )}

                    {/* Main point circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isPrimary ? 8 : isCompare ? 6.5 : isHovered ? 6 : 4.5}
                      fill={clusterColor}
                      stroke={isPrimary ? 'var(--accent-pink)' : isCompare ? '#38bdf8' : '#ffffff'}
                      strokeWidth={isPrimary ? 2.5 : isCompare ? 2 : isHovered ? 2 : 1}
                      fillOpacity={isPrimary || isCompare || isHovered ? 1 : 0.85}
                    />

                    {/* Topic text label */}
                    <text
                      x={cx + 8}
                      y={cy + 4}
                      fill={isPrimary ? '#ffffff' : isCompare ? '#38bdf8' : isHovered ? '#ffffff' : '#cbd5e1'}
                      fontSize={isPrimary ? '12' : isCompare ? '11.5' : isHovered ? '11' : '10'}
                      fontWeight={isPrimary || isCompare || isHovered ? '600' : '500'}
                      fontFamily="var(--font-sans)"
                      pointerEvents="none"
                      style={{
                        textShadow: '0 1px 4px rgba(0,0,0,0.95)'
                      }}
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
                  left: '14px',
                  background: 'rgba(13, 16, 23, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'var(--shadow-subtle)',
                  maxWidth: '280px',
                  zIndex: 30
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#ffffff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: hoveredTopic.color }} />
                  <span>{hoveredTopic.name}</span>
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

        {/* RIGHT COLUMN: TOPIC COMPARISON & DETAILS PANEL */}
        <div className="cluster-comparison-panel" role="region" aria-label="Topic Comparison & Trajectory Details">
          {/* Header */}
          <div className="comparison-header">
            <div className="comparison-title-box">
              <span className="card-eyebrow-section">COMPARISON & TRAJECTORY ANALYSIS</span>
              <div className="comparison-subject-row">
                <span
                  className="comparison-topic-dot"
                  style={{ backgroundColor: primaryTopic.color }}
                  aria-hidden="true"
                />
                <h3 className="comparison-subject-name">{primaryTopic.name}</h3>
              </div>
              <span className="comparison-subject-meta">
                Introduced {primaryTopic.introduced} · {primaryTopic.category}
              </span>
            </div>

            <button
              className="comparison-workbench-jump-btn"
              onClick={() => onSelectTopic(primaryTopic.id)}
              title="Inspect in Investigation Deck"
            >
              <span>Inspect Deck</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Cluster Assignment Badge */}
          <div className="comparison-cluster-banner">
            <div className="cluster-tag-badge">
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: clusterPalette[primaryWithCluster.cluster_idx % clusterPalette.length]
                }}
              />
              <span style={{ color: '#ffffff' }}>
                Assigned to Cluster {primaryWithCluster.cluster_idx + 1}
              </span>
              <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>
                ({currentCentroids[primaryWithCluster.cluster_idx]?.topics.length || 0} topics in group)
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-pink)' }}>
              Group CAGR: {primaryCentroid?.cagr?.toFixed(1)}% · Volatility: {primaryCentroid?.volatility?.toFixed(1)}σ
            </span>
          </div>

          {/* 2D Space Position / Coordinates */}
          <div className="cluster-coordinates-box">
            <div className="coord-label">
              Active Coordinates ({axisMode === 'pca' ? 'PCA Standardized Space' : 'Custom Dimensions'}):
            </div>
            <div className="coord-values-grid">
              <div className="coord-item">
                <span>{axisMode === 'pca' ? 'Dim 1 (Scale/Growth):' : 'X Axis:'}</span>
                <strong>{axisMode === 'pca' ? primaryWithCluster.pca_x.toFixed(2) : axisMode === 'growth_volatility' ? `${primaryWithCluster.cagr.toFixed(1)}%` : `${primaryWithCluster.peak_intensity.toFixed(0)}/100`}</strong>
              </div>
              <div className="coord-item">
                <span>{axisMode === 'pca' ? 'Dim 2 (Longevity):' : 'Y Axis:'}</span>
                <strong>{axisMode === 'pca' ? primaryWithCluster.pca_y.toFixed(2) : axisMode === 'growth_volatility' ? `${primaryWithCluster.volatility.toFixed(1)}σ` : `${primaryWithCluster.persistence_months.toFixed(0)}m`}</strong>
              </div>
            </div>
          </div>

          {/* Comparison Selector */}
          <div className="compare-selector-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitCompare size={13} color="var(--accent-pink)" />
              <span className="compare-selector-label">COMPARE WITH:</span>
            </div>
            <select
              value={compareTopicId || ''}
              onChange={(e) => setCompareTopicId(e.target.value || null)}
              className="compare-select-dropdown"
              aria-label="Select secondary topic for side-by-side comparison"
            >
              <option value="">(None — Single Topic Inspection)</option>
              {topics
                .filter((t) => t.id !== primaryTopic.id)
                .map((t) => (
                  <option key={`opt-${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Side-by-Side Comparison Matrix OR Single Topic Feature Grid */}
          {compareWithCluster ? (
            <div className="comparison-side-by-side-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#ffffff' }}>{primaryTopic.name}</strong> vs <strong style={{ color: '#38bdf8' }}>{compareTopic?.name}</strong>
                </span>
                <span style={{ color: 'var(--accent-pink)' }}>
                  Spatial Δ: {featureDistance}
                </span>
              </div>

              <table className="comparison-diff-table" aria-label="Side by side feature comparison">
                <thead>
                  <tr>
                    <th>METRIC</th>
                    <th>{primaryTopic.name.slice(0, 14)}</th>
                    <th>{compareTopic?.name.slice(0, 14)}</th>
                    <th>DELTA (Δ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)' }}>CAGR (Growth)</td>
                    <td>+{primaryWithCluster.cagr}%</td>
                    <td>+{compareWithCluster.cagr}%</td>
                    <td className={primaryWithCluster.cagr >= compareWithCluster.cagr ? 'delta-pos' : 'delta-neg'}>
                      {(primaryWithCluster.cagr - compareWithCluster.cagr) > 0 ? '+' : ''}
                      {(primaryWithCluster.cagr - compareWithCluster.cagr).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)' }}>Volatility (σ)</td>
                    <td>{primaryWithCluster.volatility}σ</td>
                    <td>{compareWithCluster.volatility}σ</td>
                    <td className={primaryWithCluster.volatility <= compareWithCluster.volatility ? 'delta-pos' : 'delta-neg'}>
                      {(primaryWithCluster.volatility - compareWithCluster.volatility) > 0 ? '+' : ''}
                      {(primaryWithCluster.volatility - compareWithCluster.volatility).toFixed(1)}σ
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)' }}>Peak Normalized</td>
                    <td>{primaryWithCluster.peak_intensity}/100</td>
                    <td>{compareWithCluster.peak_intensity}/100</td>
                    <td className={primaryWithCluster.peak_intensity >= compareWithCluster.peak_intensity ? 'delta-pos' : 'delta-neg'}>
                      {(primaryWithCluster.peak_intensity - compareWithCluster.peak_intensity) > 0 ? '+' : ''}
                      {(primaryWithCluster.peak_intensity - compareWithCluster.peak_intensity).toFixed(0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)' }}>Persistence</td>
                    <td>{primaryWithCluster.persistence_months}m</td>
                    <td>{compareWithCluster.persistence_months}m</td>
                    <td className={primaryWithCluster.persistence_months >= compareWithCluster.persistence_months ? 'delta-pos' : 'delta-neg'}>
                      {(primaryWithCluster.persistence_months - compareWithCluster.persistence_months) > 0 ? '+' : ''}
                      {(primaryWithCluster.persistence_months - compareWithCluster.persistence_months).toFixed(0)}m
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)' }}>Post-Peak Drop</td>
                    <td>{(primaryWithCluster.decay_ratio * 100).toFixed(0)}%</td>
                    <td>{(compareWithCluster.decay_ratio * 100).toFixed(0)}%</td>
                    <td className={primaryWithCluster.decay_ratio <= compareWithCluster.decay_ratio ? 'delta-pos' : 'delta-neg'}>
                      {((primaryWithCluster.decay_ratio - compareWithCluster.decay_ratio) * 100).toFixed(0)}%
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-secondary)' }}>Cluster Group</td>
                    <td style={{ color: clusterPalette[primaryWithCluster.cluster_idx % clusterPalette.length] }}>
                      C{primaryWithCluster.cluster_idx + 1}
                    </td>
                    <td style={{ color: clusterPalette[compareWithCluster.cluster_idx % clusterPalette.length] }}>
                      C{compareWithCluster.cluster_idx + 1}
                    </td>
                    <td className={primaryWithCluster.cluster_idx === compareWithCluster.cluster_idx ? 'delta-pos' : 'delta-neu'}>
                      {primaryWithCluster.cluster_idx === compareWithCluster.cluster_idx ? 'Identical Group' : 'Different Group'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Single Topic Relevant Statistical Features */
            <div className="comparison-features-grid">
              <div className="comp-metric-box">
                <span className="comp-metric-label">Growth (CAGR)</span>
                <span className="comp-metric-val" style={{ color: 'var(--accent-emerald)' }}>
                  +{primaryWithCluster.cagr}%
                </span>
              </div>
              <div className="comp-metric-box">
                <span className="comp-metric-label">Volatility (σ)</span>
                <span className="comp-metric-val">{primaryWithCluster.volatility}σ</span>
              </div>
              <div className="comp-metric-box">
                <span className="comp-metric-label">Peak Intensity</span>
                <span className="comp-metric-val">{primaryWithCluster.peak_intensity}/100</span>
              </div>
              <div className="comp-metric-box">
                <span className="comp-metric-label">Persistence</span>
                <span className="comp-metric-val">{primaryWithCluster.persistence_months} mos</span>
              </div>
              <div className="comp-metric-box">
                <span className="comp-metric-label">Post-Peak Drop</span>
                <span className="comp-metric-val">{(primaryWithCluster.decay_ratio * 100).toFixed(0)}%</span>
              </div>
              <div className="comp-metric-box">
                <span className="comp-metric-label">Diffusion Entropy</span>
                <span className="comp-metric-val">{primaryWithCluster.entropy}</span>
              </div>
            </div>
          )}

          {/* Cluster Peers (Topics in Same Group) */}
          <div className="comparison-peers-section">
            <span className="comparison-peers-label">
              Peer Topics in Cluster {primaryWithCluster.cluster_idx + 1} ({peerTopics.length}):
            </span>
            <div className="comparison-peers-pills">
              {peerTopics.map((pt) => (
                <button
                  key={`peer-${pt.topic_id}`}
                  className="peer-topic-pill"
                  onClick={() => handleTopicTabClick(pt.topic_id)}
                  title={`Inspect ${pt.name}`}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: pt.color, display: 'inline-block', marginRight: '4px' }} />
                  <span>{pt.name}</span>
                </button>
              ))}
              {peerTopics.length === 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No other topics in this cluster.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CLUSTER ARCHETYPE SUMMARY BREAKDOWN (Authentic Centroid Insights) */}
      <div className="archetype-cards-list">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="card-eyebrow-section">CLUSTER GROUP PROFILES · CENTROID AVERAGES</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
            k={k} Partitioning
          </span>
        </div>

        <div className="archetype-cards-grid">
          {currentCentroids.map((c, cIdx) => {
            const clusterColor = clusterPalette[cIdx % clusterPalette.length];
            const memberTopics = topicsWithCluster.filter((t) => t.cluster_idx === cIdx);
            const isPrimaryCluster = primaryWithCluster.cluster_idx === cIdx;

            return (
              <div
                key={`centroid-card-${cIdx}`}
                className={`archetype-profile-card ${isPrimaryCluster ? 'is-highlighted-cluster' : ''}`}
              >
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
                      className={`topic-chip-btn ${selectedTopicId === t.topic_id ? 'is-primary' : ''}`}
                      style={{ fontSize: '11px', padding: '2px 7px' }}
                      onClick={() => handleTopicTabClick(t.topic_id)}
                      title="Inspect topic in Cluster Lab"
                    >
                      <span className="topic-chip-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className="topic-color-dot" style={{ backgroundColor: t.color }}></span>
                        <span style={{ color: '#f1f5f9' }}>{t.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Mathematical Assumptions & Interpretive Boundaries */}
      <div className="workbench-card" style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-pink)' }}>
          <SlidersHorizontal size={14} />
          <h4 style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mathematical Assumptions & Interpretive Boundaries
          </h4>
        </div>
        <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {kmeansData.limitations.map((lim, idx) => (
            <li key={`lim-${idx}`} style={{ marginBottom: '3px' }}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
