import React from 'react';

interface HeroEvidenceProps {
  totalEvents: number;
}

export const HeroEvidence: React.FC<HeroEvidenceProps> = ({ totalEvents }) => {
  return (
    <section className="hero-editorial-section" aria-label="Tech Lore Editorial Introduction">
      {/* Background Celestial Orbital Guide Rings */}
      <div className="orbital-canvas-bg" aria-hidden="true">
        <div className="orbital-ring ring-1"></div>
        <div className="orbital-ring ring-2"></div>
        <div className="orbital-ring ring-3"></div>
      </div>

      {/* 1. Small Editorial Eyebrow Label */}
      <div className="hero-eyebrow-container">
        <span className="hero-eyebrow-symbol">⌁</span>
        <span className="hero-eyebrow-label">TECH LORE</span>
      </div>

      {/* 2. Dominant Headline */}
      <h1 className="hero-headline-dominant">
        Before it was everywhere.
      </h1>

      {/* 3. Archive Metadata Information Line */}
      <div className="hero-metadata-line" role="region" aria-label="Archive Scope">
        <span className="metadata-item">
          <strong className="metadata-val">23</strong>
          <span className="metadata-lbl">TOPICS</span>
        </span>
        <span className="metadata-dot">·</span>
        <span className="metadata-item">
          <strong className="metadata-val">2004—2026</strong>
          <span className="metadata-lbl">ARCHIVE</span>
        </span>
        <span className="metadata-dot">·</span>
        <span className="metadata-item">
          <strong className="metadata-val">{totalEvents}</strong>
          <span className="metadata-lbl">CATALYSTS</span>
        </span>
      </div>
    </section>
  );
};
