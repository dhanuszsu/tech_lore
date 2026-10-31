import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LoreCard } from './LoreCard';
import { buildTopicHistoryProfile, type TopicHistoryProfile } from '../utils/topicHistory';
import type { Topic, EvidenceEvent, TopicFeatures } from '../types';

export interface LoreIndexProps {
  topics: Topic[];
  events: EvidenceEvent[];
  timeseriesData: Record<string, number[]>;
  dates: string[];
  topicFeatures?: TopicFeatures[];
  selectedTopicIds: string[];
  primaryTopicId: string;
  onSelectTopic: (topicId: string) => void;
  searchQuery?: string;
}

type ArchiveFilter = 'all' | 'active' | 'catalysts' | 'surge';

export const LoreIndex: React.FC<LoreIndexProps> = ({
  topics,
  events,
  timeseriesData,
  dates,
  topicFeatures,
  selectedTopicIds,
  primaryTopicId,
  onSelectTopic,
  searchQuery = ''
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Archive Sorting / Filter State
  const [activeFilter, setActiveFilter] = useState<ArchiveFilter>('all');

  // Scroll-Driven Historical Year State for Cards
  const [activeYear, setActiveYear] = useState<number>(2022);

  // 1. Build authentic topic profiles for all 24 topics (memoized)
  const allProfiles = useMemo<TopicHistoryProfile[]>(() => {
    return topics.map((t, index) =>
      buildTopicHistoryProfile(t, events, timeseriesData, dates, topicFeatures, index)
    );
  }, [topics, events, timeseriesData, dates, topicFeatures]);

  // Map for fast O(1) lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, TopicHistoryProfile>();
    for (const p of allProfiles) {
      map.set(p.topic.id, p);
    }
    return map;
  }, [allProfiles]);

  // Topic matching set for active search query
  const matchingTopicIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return new Set<string>();
    const matches = new Set<string>();

    topics.forEach((t) => {
      const name = t.name.toLowerCase();
      const id = t.id.toLowerCase();
      const cat = t.category.toLowerCase();
      if (name.includes(q) || id.includes(q.replace(/\s+/g, '_')) || cat.includes(q)) {
        matches.add(t.id);
      }
    });

    events.forEach((ev) => {
      if (
        ev.title.toLowerCase().includes(q) ||
        ev.summary.toLowerCase().includes(q) ||
        String(ev.year) === q
      ) {
        ev.topics.forEach((tid) => matches.add(tid));
      }
    });

    return matches;
  }, [searchQuery, topics, events]);

  // 2. Filter & Sort topics based on minimal archive controls
  const displayedProfiles = useMemo<TopicHistoryProfile[]>(() => {
    const list = [...allProfiles];

    switch (activeFilter) {
      case 'active':
        // Sort by latest search interest descending
        return list.sort((a, b) => b.latestInterest - a.latestInterest);

      case 'catalysts':
        // Sort by verified catalyst count descending
        return list.sort((a, b) => b.catalystCount - a.catalystCount);

      case 'surge':
        // Filter recent surge & modern wave topics
        return list.filter((p) => p.isRecentSurge || p.startYear >= 2021);

      case 'all':
      default:
        // Canonical catalog order 01 to 24
        return list;
    }
  }, [allProfiles, activeFilter]);



  // 4. Scroll-Driven Year Tracker:
  // Dynamically determines active year from visible topic cards' actual historical data
  useEffect(() => {
    const container = cardsContainerRef.current;
    if (!container) return;

    let ticking = false;

    const updateActiveYearFromScroll = () => {
      ticking = false;
      const cardElements = container.querySelectorAll<HTMLElement>('.lore-card');
      if (cardElements.length === 0) return;

      const viewportHeight = window.innerHeight;
      const readingLineY = viewportHeight * 0.45; // 45% down the viewport

      let closestCard: HTMLElement | null = null;
      let minDistance = Infinity;
      let relativeProgressInCard = 0.5;

      for (let i = 0; i < cardElements.length; i++) {
        const el = cardElements[i];
        const rect = el.getBoundingClientRect();

        // Card vertical center
        const cardCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenterY - readingLineY);

        if (distance < minDistance) {
          minDistance = distance;
          closestCard = el;
          // Progress from 0 (top entering reading line) to 1 (bottom leaving reading line)
          const progress = (readingLineY - rect.top) / rect.height;
          relativeProgressInCard = Math.max(0, Math.min(1, progress));
        }
      }

      if (closestCard) {
        const topicId = closestCard.getAttribute('data-topic-id');
        if (topicId) {
          const profile = profileMap.get(topicId);
          if (profile) {
            let targetYear = profile.dominantYear;

            if (profile.catalystYears.length > 1) {
              // Interpolate smoothly through actual catalyst years as card scrolls through reading line
              const years = profile.catalystYears;
              const index = Math.min(
                years.length - 1,
                Math.floor(relativeProgressInCard * years.length)
              );
              targetYear = years[index];
            } else if (profile.catalystYears.length === 1) {
              targetYear = profile.catalystYears[0];
            } else {
              targetYear = profile.peakYear || profile.startYear;
            }

            // Bound between 2004 and 2026
            targetYear = Math.max(2004, Math.min(2026, targetYear));

            setActiveYear((prev) => (prev !== targetYear ? targetYear : prev));
          }
        }
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveYearFromScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial evaluation
    updateActiveYearFromScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [displayedProfiles, profileMap]);

  return (
    <section
      id="lore-index"
      ref={sectionRef}
      className="lore-index-section"
      aria-label="Lore Index: Historical Archive of Technologies"
    >
      {/* 1. Archive Section Header */}
      <div className="lore-index-header">
        <div className="lore-header-lead">
          <div className="lore-eyebrow-container">
            <span className="lore-eyebrow-glyph" aria-hidden="true">⌁</span>
            <span className="lore-index-eyebrow">LORE INDEX</span>
          </div>

          <h2 className="lore-index-headline">
            Every trend has a history.
          </h2>

          <div className="lore-index-metadata" role="region" aria-label="Index Scope">
            <span className="metadata-token">
              <strong className="token-num">{topics.length}</strong> TOPICS
            </span>
            <span className="metadata-divider">·</span>
            <span className="metadata-token">2004—2026</span>
          </div>
        </div>

        {/* 2. Minimal Archive Navigation Controls */}
        <div className="lore-archive-nav" role="tablist" aria-label="Archive view sorting">
          <button
            role="tab"
            aria-selected={activeFilter === 'all'}
            className={`lore-nav-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            ALL
          </button>
          <button
            role="tab"
            aria-selected={activeFilter === 'active'}
            className={`lore-nav-btn ${activeFilter === 'active' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            MOST ACTIVE
          </button>
          <button
            role="tab"
            aria-selected={activeFilter === 'catalysts'}
            className={`lore-nav-btn ${activeFilter === 'catalysts' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('catalysts')}
          >
            MOST CATALYSTS
          </button>
          <button
            role="tab"
            aria-selected={activeFilter === 'surge'}
            className={`lore-nav-btn ${activeFilter === 'surge' ? 'is-active' : ''}`}
            onClick={() => setActiveFilter('surge')}
          >
            RECENT SURGE
          </button>
        </div>
      </div>

      {/* 3. Topic Cards Grid with Intentional Visual Rhythm */}
      <div
        ref={cardsContainerRef}
        className="lore-cards-grid"
        role="region"
        aria-label="Archive Topic Specimens"
      >
        {displayedProfiles.map((profile, idx) => {
          const isFocused = primaryTopicId === profile.topic.id;
          const isActive = selectedTopicIds.includes(profile.topic.id);

          // Insert subtle archival rhythm marker every 6 cards for editorial pacing
          const isRhythmBreak = (idx + 1) % 6 === 0 && idx < displayedProfiles.length - 1;

          return (
            <React.Fragment key={profile.topic.id}>
              <LoreCard
                profile={profile}
                isFocused={isFocused}
                isActive={isActive}
                activeArchiveYear={activeYear}
                onSelect={onSelectTopic}
                hasSearchQuery={searchQuery.trim().length > 0}
                isSearchMatched={matchingTopicIds.has(profile.topic.id)}
              />
              {isRhythmBreak && (
                <div className="lore-rhythm-separator" aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 4. Archive Summary Line */}
      <footer className="lore-archive-summary-footer" aria-label="Archive Corpus Summary">
        <div className="lore-summary-line">
          <span className="summary-part">
            <strong>{topics.length}</strong> TOPICS
          </span>
          <span className="summary-dot">·</span>
          <span className="summary-part">2004—2026</span>
          <span className="summary-dot">·</span>
          <span className="summary-part">
            <strong>{events.length}</strong> CATALYSTS
          </span>
        </div>
        <div className="lore-summary-hint">
          Select any technology to investigate in the research workbench ↓
        </div>
      </footer>

    </section>
  );
};
