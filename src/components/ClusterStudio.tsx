import React, { useState, useMemo } from 'react';
import type { Topic, TopicFeatures, KMeansExport } from '../types';
import { BarChart3, GitCompare, ArrowRight, SlidersHorizontal, TrendingUp, Clock, Zap, Activity, Layers } from 'lucide-react';

interface ClusterStudioProps {
  topics: Topic[];
  kmeansData: KMeansExport;
  onSelectTopic: (topicId: string) => void;
}

// Handcrafted layout offsets for PCA 2D projection so that all 23 topic labels are 100% visible and uncollided
const pcaLabelOffsets: Record<string, { anchor: 'start' | 'end'; dx: number; dy: number }> = {
  // Right-side topics (anchor: 'end' ensures text flows toward the interior and never clips the right border)
  alphago: { anchor: 'end', dx: -12, dy: 4 },
  metaverse: { anchor: 'end', dx: -12, dy: 4 },
  stable_diffusion: { anchor: 'end', dx: -12, dy: 4 },
  bert: { anchor: 'start', dx: 12, dy: 4 },
  prompt_engineering: { anchor: 'start', dx: 12, dy: 4 },

  // Center frontier
  generative_ai: { anchor: 'start', dx: 12, dy: -4 },
  large_language_models: { anchor: 'start', dx: 12, dy: 4 },
  ai_agents: { anchor: 'end', dx: -12, dy: 4 },

  // Bottom foundation
  convolutional_neural_network: { anchor: 'start', dx: 12, dy: 4 },
  expert_systems: { anchor: 'end', dx: -12, dy: 4 },
  support_vector_machines: { anchor: 'start', dx: 12, dy: 4 },
  agi: { anchor: 'end', dx: -12, dy: 4 },

  // Left classic AI cluster - staggered cleanly across left/right/top/bottom
  transformer_model: { anchor: 'start', dx: 10, dy: -12 },
  deep_learning: { anchor: 'end', dx: -12, dy: 0 },
  midjourney: { anchor: 'start', dx: 8, dy: -14 },
  data_science: { anchor: 'start', dx: 12, dy: 0 },
  machine_learning: { anchor: 'start', dx: 12, dy: 14 },
  natural_language_processing: { anchor: 'start', dx: 12, dy: 26 },
  neural_networks: { anchor: 'start', dx: 12, dy: 38 },
  robotics: { anchor: 'end', dx: -12, dy: 2 },
  quantum_computing: { anchor: 'end', dx: -12, dy: -12 },
  computer_vision: { anchor: 'start', dx: 10, dy: -4 },
  reinforcement_learning: { anchor: 'end', dx: -12, dy: 18 }
};

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

  const plotWidth = 760;
  const plotHeight = 480;
  const padding = 56;

  const [minX, maxX, minY, maxY, labelX, labelY] = useMemo(() => {
    if (axisMode === 'pca') {
      return [-3.2, 4.2, -2.8, 3.0, 'Dimension 1 (Scale & Growth)', 'Dimension 2 (Changes & Longevity)'];
    } else if (axisMode === 'growth_volatility') {
      return [-30, 260, 0, 16, 'Growth Over Time (%)', 'Trend Changes (σ)'];
    } else {
      return [0, 105, 0, 270, 'Highest Interest (0–100)', 'How Long It Stayed Popular (Months)'];
    }
  }, [axisMode]);

  const getCoord = (tf: typeof topicsWithCluster[0]): [number, number] => {
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
    setSelectedTopicId(topicId);
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

  // Sort topics so selected and hovered topics render on top in the SVG stacking order
  const sortedTopics = useMemo(() => {
    return [...topicsWithCluster].sort((a, b) => {
      const scoreA =
        (a.topic_id === primaryTopic.id ? 10 : 0) +
        (a.topic_id === compareTopic?.id ? 5 : 0) +
        (a.topic_id === hoveredTopic?.topic_id ? 3 : 0);
      const scoreB =
        (b.topic_id === primaryTopic.id ? 10 : 0) +
        (b.topic_id === compareTopic?.id ? 5 : 0) +
        (b.topic_id === hoveredTopic?.topic_id ? 3 : 0);
      return scoreA - scoreB;
    });
  }, [topicsWithCluster, primaryTopic, compareTopic, hoveredTopic]);

  // ==========================================
  // COMPARISON STORY CALCULATIONS (ISSUE 2)
  // ==========================================
  const comparisonStory = useMemo(() => {
    if (!compareWithCluster || !compareTopic) return null;

    const p = primaryWithCluster;
    const c = compareWithCluster;

    // 1. CAGR / Velocity
    const maxCagr = Math.max(p.cagr, c.cagr, 1);
    const cagrDiff = Math.abs(p.cagr - c.cagr).toFixed(1);
    const cagrLeader = p.cagr > c.cagr ? primaryTopic.name : c.cagr > p.cagr ? compareTopic.name : null;
    const cagrLeaderText = cagrLeader
      ? `${cagrLeader} leads (+${cagrDiff}%/yr)`
      : 'Identical expansion speed';
    const cagrInterpretation = p.cagr > c.cagr
      ? `${primaryTopic.name} expanded at a steeper velocity, growing +${cagrDiff}% faster per year than ${compareTopic.name}.`
      : c.cagr > p.cagr
      ? `${compareTopic.name} scaled faster over its adoption curve, outpacing ${primaryTopic.name} by +${cagrDiff}% per year.`
      : 'Both technologies scaled at an identical annual expansion pace.';

    // 2. Persistence / Longevity
    const maxPers = Math.max(p.persistence_months, c.persistence_months, 1);
    const persDiff = Math.abs(p.persistence_months - c.persistence_months);
    const persLeader = p.persistence_months > c.persistence_months ? primaryTopic.name : c.persistence_months > p.persistence_months ? compareTopic.name : null;
    const persLeaderText = persLeader
      ? `${persLeader} leads (+${persDiff} mos)`
      : 'Equal staying power';
    const persInterpretation = p.persistence_months > c.persistence_months
      ? `${primaryTopic.name} maintained mainstream momentum longer, sustaining ${persDiff} additional months above baseline.`
      : c.persistence_months > p.persistence_months
      ? `${compareTopic.name} demonstrated greater staying power, outlasting ${primaryTopic.name} by ${persDiff} months.`
      : 'Both technologies maintained active adoption for an identical number of months.';

    // 3. Peak Attention
    const peakDiff = Math.abs(p.peak_intensity - c.peak_intensity).toFixed(0);
    const peakLeader = p.peak_intensity > c.peak_intensity ? primaryTopic.name : c.peak_intensity > p.peak_intensity ? compareTopic.name : null;
    const peakLeaderText = peakLeader
      ? `${peakLeader} reached higher apex (+${peakDiff})`
      : 'Tied historical apex';
    const peakInterpretation = p.peak_intensity > c.peak_intensity
      ? `${primaryTopic.name} reached a stronger peak volume at its cultural zenith (${p.peak_intensity}/100).`
      : c.peak_intensity > p.peak_intensity
      ? `${compareTopic.name} reached a higher peak search volume at its cultural zenith (${c.peak_intensity}/100).`
      : 'Both technologies achieved identical search visibility at their cultural zeniths.';

    // 4. Volatility / Curve Stability
    const maxVol = Math.max(p.volatility, c.volatility, 0.1);
    const smootherLeader = p.volatility < c.volatility ? primaryTopic.name : c.volatility < p.volatility ? compareTopic.name : null;
    const volLeaderText = smootherLeader
      ? `${smootherLeader} steadier curve`
      : 'Comparable volatility';
    const volInterpretation = p.volatility < c.volatility
      ? `${primaryTopic.name} followed a smoother adoption curve (${p.volatility}σ) with less boom-and-bust fluctuation than ${compareTopic.name} (${c.volatility}σ).`
      : c.volatility < p.volatility
      ? `${compareTopic.name} exhibited a steadier, more predictable adoption curve (${c.volatility}σ) compared to ${primaryTopic.name} (${p.volatility}σ).`
      : 'Both technologies exhibited similar degrees of trajectory volatility.';

    // 5. Synthesis Editorial Verdict
    const isSameFamily = p.cluster_idx === c.cluster_idx;
    const verdictText = isSameFamily
      ? `${primaryTopic.name} and ${compareTopic.name} share Cluster C${p.cluster_idx + 1} as close behavioral siblings. While ${cagrLeader || primaryTopic.name} expanded with greater initial velocity, ${persLeader || primaryTopic.name} achieved longer sustained staying power. Their spatial proximity (${featureDistance}) confirms deeply interconnected evolutionary arcs.`
      : `${primaryTopic.name} (Cluster C${p.cluster_idx + 1}) and ${compareTopic.name} (Cluster C${c.cluster_idx + 1}) follow distinct behavioral archetypes. ${cagrLeader || primaryTopic.name} led in annual expansion speed (+${Math.max(p.cagr, c.cagr)}%/yr), while ${persLeader || primaryTopic.name} demonstrated greater endurance (${Math.max(p.persistence_months, c.persistence_months)} months).`;

    return {
      maxCagr,
      cagrLeaderText,
      cagrInterpretation,
      maxPers,
      persLeaderText,
      persInterpretation,
      peakLeaderText,
      peakInterpretation,
      maxVol,
      volLeaderText,
      volInterpretation,
      isSameFamily,
      verdictText
    };
  }, [primaryWithCluster, compareWithCluster, primaryTopic, compareTopic, featureDistance]);

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
        {/* LEFT COLUMN: 2D Feature Space Scatter Plot (100% permanently visible labels) */}
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
                y={plotHeight - 16}
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

              {/* Data points and permanently visible topic labels */}
              {sortedTopics.map((tf) => {
                const [cx, cy] = getCoord(tf);
                const clusterColor = clusterPalette[tf.cluster_idx % clusterPalette.length];
                const isPrimary = tf.topic_id === primaryTopic.id;
                const isCompare = tf.topic_id === compareTopic?.id;
                const isHovered = hoveredTopic?.topic_id === tf.topic_id;
                const isHighlighted = isPrimary || isCompare || isHovered;

                const offset: { anchor: 'start' | 'end'; dx: number; dy: number } = axisMode === 'pca'
                  ? (pcaLabelOffsets[tf.topic_id] || (cx > plotWidth * 0.6 ? { anchor: 'end', dx: -12, dy: 4 } : { anchor: 'start', dx: 12, dy: 4 }))
                  : { anchor: cx > plotWidth * 0.58 ? 'end' : 'start', dx: cx > plotWidth * 0.58 ? -12 : 12, dy: 4 };

                const tx = cx + offset.dx;
                const ty = cy + offset.dy;

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
                        r={14}
                        fill="none"
                        stroke="var(--accent-pink)"
                        strokeWidth="1.8"
                        opacity="0.75"
                        className="pulse-ring"
                      />
                    )}

                    {/* Secondary ring for compare topic */}
                    {isCompare && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={12}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                        strokeDasharray="3 2"
                        opacity="0.85"
                      />
                    )}

                    {/* Connecting tick line if label offset vertically */}
                    {offset.dy !== 4 && (
                      <line
                        x1={cx}
                        y1={cy}
                        x2={tx + (offset.anchor === 'end' ? 6 : -6)}
                        y2={ty - 3}
                        stroke={isPrimary ? 'var(--accent-pink)' : isCompare ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity={isHighlighted ? 0.9 : 0.45}
                      />
                    )}

                    {/* Main point circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isPrimary ? 8.5 : isCompare ? 7 : isHovered ? 6.5 : 5}
                      fill={clusterColor}
                      stroke={isPrimary ? 'var(--accent-pink)' : isCompare ? '#38bdf8' : '#ffffff'}
                      strokeWidth={isPrimary ? 2.5 : isCompare ? 2 : isHovered ? 2 : 1.2}
                      fillOpacity={isHighlighted ? 1 : 0.88}
                    />

                    {/* Topic text label: Always visible, dark outline stroke halo prevents overlap clashes */}
                    <text
                      x={tx}
                      y={ty}
                      textAnchor={offset.anchor}
                      fill={isPrimary ? '#ffffff' : isCompare ? '#38bdf8' : isHovered ? '#ffffff' : '#e2e8f0'}
                      fontSize={isPrimary ? '12' : isCompare ? '11.5' : isHovered ? '11' : '10.5'}
                      fontWeight={isPrimary ? '700' : isCompare ? '600' : isHovered ? '600' : '500'}
                      fontFamily="var(--font-sans)"
                      stroke="rgba(11, 14, 20, 0.95)"
                      strokeWidth={isHighlighted ? '3.5' : '3'}
                      paintOrder="stroke fill"
                      style={{
                        userSelect: 'none',
                        transition: 'fill 0.15s ease, font-size 0.15s ease'
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

        {/* RIGHT COLUMN: TOPIC COMPARISON & TRAJECTORY ANALYSIS (TECH LORE EXPERIENCE) */}
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
                {compareTopic && (
                  <>
                    <span style={{ color: 'var(--text-dim)', fontSize: '13px', margin: '0 2px' }}>vs</span>
                    <span
                      className="comparison-topic-dot"
                      style={{ backgroundColor: compareTopic.color }}
                      aria-hidden="true"
                    />
                    <h3 className="comparison-subject-name" style={{ color: '#38bdf8' }}>{compareTopic.name}</h3>
                  </>
                )}
              </div>
              <span className="comparison-subject-meta">
                {primaryTopic.category} · Introduced {primaryTopic.introduced}
                {compareTopic && ` | ${compareTopic.category} · Introduced ${compareTopic.introduced}`}
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

          {/* Comparison Selector Dropdown */}
          <div className="compare-selector-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitCompare size={13} color="var(--accent-pink)" />
              <span className="compare-selector-label">COMPARE WITH:</span>
            </div>
            <select
              value={compareTopicId || ''}
              onChange={(e) => setCompareTopicId(e.target.value || null)}
              className="compare-select-dropdown"
              aria-label="Select secondary topic for trajectory comparison"
            >
              <option value="">(None — Single Topic Profile)</option>
              {topics
                .filter((t) => t.id !== primaryTopic.id)
                .map((t) => (
                  <option key={`opt-${t.id}`} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Comparison Body: Side-by-Side Visual Story vs Single Topic Profile */}
          {comparisonStory && compareWithCluster ? (
            <div className="comparison-lore-experience">
              {/* Relationship Status Bar */}
              <div className="comp-relationship-bar">
                <div className="comp-relationship-badge">
                  {comparisonStory.isSameFamily ? (
                    <span className="relationship-tag family">
                      <Layers size={12} />
                      Same Technology Family (Cluster C{primaryWithCluster.cluster_idx + 1})
                    </span>
                  ) : (
                    <span className="relationship-tag divergent">
                      <GitCompare size={12} />
                      Different Archetypes (C{primaryWithCluster.cluster_idx + 1} vs C{compareWithCluster.cluster_idx + 1})
                    </span>
                  )}
                  <span className="relationship-dist">
                    Spatial Proximity: <strong>Δ {featureDistance}</strong> ·{' '}
                    {Number(featureDistance) < 1.2
                      ? 'Direct Cousins'
                      : Number(featureDistance) < 2.5
                      ? 'Related Evolutionary Path'
                      : 'Distinct Adoption Curves'}
                  </span>
                </div>
              </div>

              {/* Visual Trajectory Dimension Stories */}
              <div className="comp-stories-list">
                {/* 1. Expansion Velocity */}
                <div className="comp-story-card">
                  <div className="comp-story-header">
                    <div className="comp-story-title-group">
                      <span className="comp-story-label">
                        <TrendingUp size={12} color="var(--accent-pink)" />
                        EXPANSION VELOCITY
                      </span>
                      <span className="comp-story-lead">
                        {comparisonStory.cagrLeaderText}
                      </span>
                    </div>
                  </div>

                  <div className="comp-bars-block">
                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name primary">
                          <span className="comp-bar-dot" style={{ backgroundColor: primaryTopic.color }} />
                          {primaryTopic.name}
                        </span>
                        <span className="comp-bar-value">+{primaryWithCluster.cagr}%/yr</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill primary"
                          style={{
                            width: `${Math.min(100, Math.max(12, (primaryWithCluster.cagr / comparisonStory.maxCagr) * 100))}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name compare">
                          <span className="comp-bar-dot" style={{ backgroundColor: compareTopic?.color || '#38bdf8' }} />
                          {compareTopic?.name}
                        </span>
                        <span className="comp-bar-value">+{compareWithCluster.cagr}%/yr</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill compare"
                          style={{
                            width: `${Math.min(100, Math.max(12, (compareWithCluster.cagr / comparisonStory.maxCagr) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="comp-story-interpretation">
                    {comparisonStory.cagrInterpretation}
                  </p>
                </div>

                {/* 2. Cultural Longevity */}
                <div className="comp-story-card">
                  <div className="comp-story-header">
                    <div className="comp-story-title-group">
                      <span className="comp-story-label">
                        <Clock size={12} color="var(--accent-pink)" />
                        CULTURAL LONGEVITY
                      </span>
                      <span className="comp-story-lead">
                        {comparisonStory.persLeaderText}
                      </span>
                    </div>
                  </div>

                  <div className="comp-bars-block">
                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name primary">
                          <span className="comp-bar-dot" style={{ backgroundColor: primaryTopic.color }} />
                          {primaryTopic.name}
                        </span>
                        <span className="comp-bar-value">{primaryWithCluster.persistence_months} mos</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill primary"
                          style={{
                            width: `${Math.min(100, Math.max(12, (primaryWithCluster.persistence_months / comparisonStory.maxPers) * 100))}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name compare">
                          <span className="comp-bar-dot" style={{ backgroundColor: compareTopic?.color || '#38bdf8' }} />
                          {compareTopic?.name}
                        </span>
                        <span className="comp-bar-value">{compareWithCluster.persistence_months} mos</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill compare"
                          style={{
                            width: `${Math.min(100, Math.max(12, (compareWithCluster.persistence_months / comparisonStory.maxPers) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="comp-story-interpretation">
                    {comparisonStory.persInterpretation}
                  </p>
                </div>

                {/* 3. Peak Attention */}
                <div className="comp-story-card">
                  <div className="comp-story-header">
                    <div className="comp-story-title-group">
                      <span className="comp-story-label">
                        <Zap size={12} color="var(--accent-pink)" />
                        PEAK ATTENTION APEX
                      </span>
                      <span className="comp-story-lead">
                        {comparisonStory.peakLeaderText}
                      </span>
                    </div>
                  </div>

                  <div className="comp-bars-block">
                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name primary">
                          <span className="comp-bar-dot" style={{ backgroundColor: primaryTopic.color }} />
                          {primaryTopic.name}
                        </span>
                        <span className="comp-bar-value">{primaryWithCluster.peak_intensity}/100</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill primary"
                          style={{
                            width: `${Math.min(100, Math.max(12, primaryWithCluster.peak_intensity))}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name compare">
                          <span className="comp-bar-dot" style={{ backgroundColor: compareTopic?.color || '#38bdf8' }} />
                          {compareTopic?.name}
                        </span>
                        <span className="comp-bar-value">{compareWithCluster.peak_intensity}/100</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill compare"
                          style={{
                            width: `${Math.min(100, Math.max(12, compareWithCluster.peak_intensity))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="comp-story-interpretation">
                    {comparisonStory.peakInterpretation}
                  </p>
                </div>

                {/* 4. Trajectory Stability */}
                <div className="comp-story-card">
                  <div className="comp-story-header">
                    <div className="comp-story-title-group">
                      <span className="comp-story-label">
                        <Activity size={12} color="var(--accent-pink)" />
                        TRAJECTORY STABILITY
                      </span>
                      <span className="comp-story-lead">
                        {comparisonStory.volLeaderText}
                      </span>
                    </div>
                  </div>

                  <div className="comp-bars-block">
                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name primary">
                          <span className="comp-bar-dot" style={{ backgroundColor: primaryTopic.color }} />
                          {primaryTopic.name}
                        </span>
                        <span className="comp-bar-value">{primaryWithCluster.volatility}σ {primaryWithCluster.volatility < compareWithCluster.volatility ? '(Steadier)' : '(More cyclical)'}</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill primary"
                          style={{
                            width: `${Math.min(100, Math.max(12, (primaryWithCluster.volatility / comparisonStory.maxVol) * 100))}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="comp-bar-item">
                      <div className="comp-bar-meta">
                        <span className="comp-bar-name compare">
                          <span className="comp-bar-dot" style={{ backgroundColor: compareTopic?.color || '#38bdf8' }} />
                          {compareTopic?.name}
                        </span>
                        <span className="comp-bar-value">{compareWithCluster.volatility}σ {compareWithCluster.volatility < primaryWithCluster.volatility ? '(Steadier)' : '(More cyclical)'}</span>
                      </div>
                      <div className="comp-bar-track">
                        <div
                          className="comp-bar-fill compare"
                          style={{
                            width: `${Math.min(100, Math.max(12, (compareWithCluster.volatility / comparisonStory.maxVol) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="comp-story-interpretation">
                    {comparisonStory.volInterpretation}
                  </p>
                </div>
              </div>

              {/* Synthesis Verdict Card */}
              <div className="comp-verdict-card">
                <div className="comp-verdict-title">
                  <span className="verdict-tag">ARCHIVAL SYNTHESIS</span>
                  <span className="verdict-pair">
                    {primaryTopic.name} vs {compareTopic?.name}
                  </span>
                </div>
                <p className="comp-verdict-text">
                  {comparisonStory.verdictText}
                </p>
              </div>
            </div>
          ) : (
            /* Single Topic Trajectory Profile */
            <div className="single-topic-experience">
              <div className="single-topic-header-summary">
                <span className="card-eyebrow-section">LIFECYCLE TRAJECTORY PROFILE</span>
                <p className="single-topic-bio">
                  {primaryTopic.name} debuted in <strong>{primaryTopic.introduced}</strong> ({primaryTopic.category}).
                  It established an apex search intensity of <strong>{primaryWithCluster.peak_intensity}/100</strong>, persisting for <strong>{primaryWithCluster.persistence_months} months</strong> above baseline with <strong>+{primaryWithCluster.cagr}%/yr</strong> expansion velocity.
                </p>
              </div>

              <div className="single-topic-metrics-grid">
                <div className="single-metric-card">
                  <span className="single-metric-label">Annual Velocity</span>
                  <strong className="single-metric-val" style={{ color: 'var(--accent-emerald)' }}>+{primaryWithCluster.cagr}%</strong>
                  <span className="single-metric-sub">Compound Growth</span>
                </div>
                <div className="single-metric-card">
                  <span className="single-metric-label">Cultural Longevity</span>
                  <strong className="single-metric-val" style={{ color: 'var(--accent-pink)' }}>{primaryWithCluster.persistence_months} mos</strong>
                  <span className="single-metric-sub">Sustained Adoption</span>
                </div>
                <div className="single-metric-card">
                  <span className="single-metric-label">Historical Apex</span>
                  <strong className="single-metric-val">{primaryWithCluster.peak_intensity}/100</strong>
                  <span className="single-metric-sub">Peak Search Zenith</span>
                </div>
                <div className="single-metric-card">
                  <span className="single-metric-label">Curve Volatility</span>
                  <strong className="single-metric-val">{primaryWithCluster.volatility}σ</strong>
                  <span className="single-metric-sub">Cyclical Variance</span>
                </div>
              </div>

              <div className="single-topic-callout">
                <span>Select any technology above to compare head-to-head trajectories →</span>
              </div>
            </div>
          )}

          {/* Cluster Peers (Topics in Same Group) */}
          <div className="comparison-peers-section">
            <span className="comparison-peers-label">
              Peer Topics in Cluster C{primaryWithCluster.cluster_idx + 1} ({peerTopics.length}):
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

      {/* 4. Mathematical Assumptions & Interpretive Boundaries (ISSUE 3: Clean, intentional spacing, zero empty gaps) */}
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
