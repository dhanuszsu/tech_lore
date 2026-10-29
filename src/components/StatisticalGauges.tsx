import React from 'react';
import type { Topic, TopicFeatures } from '../types';

interface StatisticalGaugesProps {
  primaryTopic: Topic;
  features: TopicFeatures | undefined;
}

export const StatisticalGauges: React.FC<StatisticalGaugesProps> = ({
  primaryTopic,
  features
}) => {
  if (!features) return null;

  return (
    <div className="stats-measurement-row" role="region" aria-label="Analytical Research Measurements">
      {/* 1. Growth Velocity / CAGR */}
      <div className="stat-metric-cell">
        <div className="stat-metric-header">
          <span className="stat-metric-label">Compound Annual Growth</span>
        </div>
        <div className="stat-metric-num" style={{ color: features.cagr >= 0 ? 'var(--accent-emerald)' : 'var(--cat-red)' }}>
          {features.cagr > 0 ? `+${features.cagr}%` : `${features.cagr}%`}
        </div>
        <div className="stat-metric-desc">
          Annualized progression rate across 2004–2026 epoch
        </div>
      </div>

      {/* 2. Rolling Volatility */}
      <div className="stat-metric-cell">
        <div className="stat-metric-header">
          <span className="stat-metric-label">Rolling Volatility</span>
        </div>
        <div className="stat-metric-num">
          {features.volatility} <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 400 }}>σ</span>
        </div>
        <div className="stat-metric-desc">
          Mean 12-month standard deviation of monthly change
        </div>
      </div>

      {/* 3. Peak Intensity */}
      <div className="stat-metric-cell">
        <div className="stat-metric-header">
          <span className="stat-metric-label">Peak Intensity</span>
        </div>
        <div className="stat-metric-num">
          {features.peak_intensity} <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 400 }}>/ 100</span>
        </div>
        <div className="stat-metric-desc">
          Inflected in <strong style={{ color: '#f1f5f9' }}>{primaryTopic.peak_date}</strong>
        </div>
      </div>

      {/* 4. Half-Life Persistence */}
      <div className="stat-metric-cell">
        <div className="stat-metric-header">
          <span className="stat-metric-label">Persistence Horizon</span>
        </div>
        <div className="stat-metric-num">
          {features.persistence_months} <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 400 }}>months</span>
        </div>
        <div className="stat-metric-desc">
          Duration sustained at ≥50% of historical peak
        </div>
      </div>
    </div>
  );
};
