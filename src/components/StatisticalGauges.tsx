import React from 'react';
import type { Topic, TopicFeatures } from '../types';

interface StatisticalGaugesProps {
  primaryTopic: Topic;
  features: TopicFeatures | undefined;
}

const formatPeakDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[monthNum - 1] || parts[1];
  return `${month} ${year}`;
};

export const StatisticalGauges: React.FC<StatisticalGaugesProps> = ({
  primaryTopic,
  features
}) => {
  if (!features) return null;

  return (
    <div className="stats-gauges-wrapper" role="region" aria-label="Topic Key Measurements">
      <div className="stats-measurement-row">
        {/* 1. Growth Over Time */}
        <div className="stat-metric-cell">
          <div className="stat-metric-header">
            <span className="stat-metric-label">Growth Over Time</span>
          </div>
          <div
            className="stat-metric-num"
            style={{ color: features.cagr >= 0 ? 'var(--accent-emerald)' : 'var(--cat-red)' }}
          >
            {features.cagr > 0 ? `+${features.cagr}%` : `${features.cagr}%`}
          </div>
          <div className="stat-metric-desc">
            Average yearly growth from 2004 to 2026
          </div>
        </div>

        {/* 2. Trend Changes */}
        <div className="stat-metric-cell">
          <div className="stat-metric-header">
            <span className="stat-metric-label">Trend Changes</span>
          </div>
          <div className="stat-metric-num">
            {features.volatility} <span className="stat-metric-unit">σ</span>
          </div>
          <div className="stat-metric-desc">
            How much the trend changes from month to month
          </div>
        </div>

        {/* 3. Highest Interest */}
        <div className="stat-metric-cell">
          <div className="stat-metric-header">
            <span className="stat-metric-label">Highest Interest</span>
          </div>
          <div className="stat-metric-num">
            {features.peak_intensity} <span className="stat-metric-unit">/ 100</span>
          </div>
          <div className="stat-metric-desc">
            Highest point: {formatPeakDate(primaryTopic.peak_date)}
          </div>
        </div>

        {/* 4. How Long It Stayed Popular */}
        <div className="stat-metric-cell">
          <div className="stat-metric-header">
            <span className="stat-metric-label">How Long It Stayed Popular</span>
          </div>
          <div className="stat-metric-num">
            {features.persistence_months} <span className="stat-metric-unit">months</span>
          </div>
          <div className="stat-metric-desc">
            Months where interest stayed above half of its highest point
          </div>
        </div>
      </div>

      {/* Clear normalization note in simple English */}
      <div className="stats-normalization-meta">
        Search interest is scaled from 0 to 100 based on the highest point in search attention.
      </div>
    </div>
  );
};
