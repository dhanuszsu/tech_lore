import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { searchTechLore, type SearchResults } from '../utils/searchEngine';
import type { Topic, EvidenceEvent } from '../types';

export interface ArchiveSearchProps {
  topics: Topic[];
  events: EvidenceEvent[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectEvent: (event: EvidenceEvent) => void;
}

export const ArchiveSearch: React.FC<ArchiveSearchProps> = ({
  topics,
  events,
  searchQuery,
  setSearchQuery,
  onSelectTopic,
  onSelectEvent
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized search execution
  const searchResults: SearchResults = useMemo(() => {
    return searchTechLore(searchQuery, topics, events);
  }, [searchQuery, topics, events]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation & escape listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleTopicClick = (topicId: string) => {
    onSelectTopic(topicId);
    setIsOpen(false);
  };

  const handleEventClick = (event: EvidenceEvent) => {
    onSelectEvent(event);
    setIsOpen(false);
  };

  const hasQuery = searchQuery.trim().length > 0;
  const hasMatches = searchResults.totalMatches > 0;

  return (
    <div ref={containerRef} className="archive-search-container">
      {/* Search Input Box */}
      <div className={`archive-search-input-box ${isOpen && hasQuery ? 'is-active' : ''}`}>
        <Search size={13} className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search topics or historical evidence (e.g. llm, chip, 2023)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (hasQuery) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search technologies and historical catalysts"
          aria-expanded={isOpen}
          role="combobox"
        />

        {hasQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            title="Clear search (Escape)"
            aria-label="Clear search query"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search Results Reference Panel */}
      {isOpen && hasQuery && (
        <div className="archive-search-dropdown animate-fade" role="listbox">
          <div className="search-dropdown-header">
            <span className="search-lead-label">SEARCH RESULTS</span>
            <span className="search-query-tag">&ldquo;{searchQuery}&rdquo;</span>
          </div>

          {!hasMatches ? (
            /* Empty State */
            <div className="search-empty-state">
              <div className="empty-state-title">NO MATCHES</div>
              <div className="empty-state-hint">Try searching for a topic, technology, catalyst, or year.</div>
            </div>
          ) : (
            <div className="search-results-scrollable">
              {/* 1. Technology Matches */}
              {searchResults.topics.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <span>TOPICS</span>
                    <span className="search-group-count">({searchResults.topics.length})</span>
                  </div>
                  <div className="search-items-list">
                    {searchResults.topics.map((item) => (
                      <button
                        key={`topic-match-${item.topic.id}`}
                        className="search-topic-result-row"
                        onClick={() => handleTopicClick(item.topic.id)}
                        role="option"
                        aria-selected={false}
                      >
                        <span className="result-topic-num">{item.indexNumber}</span>
                        <span
                          className="result-topic-color"
                          style={{ backgroundColor: item.topic.color }}
                          aria-hidden="true"
                        />
                        <div className="result-topic-info">
                          <span className="result-topic-name">{item.topic.name}</span>
                          <span className="result-topic-meta">
                            {item.dateRange} · {item.catalystCount} {item.catalystCount === 1 ? 'CATALYST' : 'CATALYSTS'}
                          </span>
                        </div>
                        <span className="result-topic-cue">VIEW →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Historical Catalyst & Evidence Matches */}
              {searchResults.events.length > 0 && (
                <div className="search-group">
                  <div className="search-group-title">
                    <span>EVIDENCE / HISTORICAL REFERENCES</span>
                    <span className="search-group-count">({searchResults.events.length})</span>
                  </div>
                  <div className="search-items-list">
                    {searchResults.events.map((item) => (
                      <button
                        key={`event-match-${item.event.id}`}
                        className="search-event-result-row"
                        onClick={() => handleEventClick(item.event)}
                        role="option"
                        aria-selected={false}
                      >
                        <span className="result-event-year">{item.event.year}</span>
                        <div className="result-event-info">
                          <span className="result-event-title">{item.event.title}</span>
                          <span className="result-event-summary">
                            {item.event.summary.length > 95
                              ? `${item.event.summary.slice(0, 95)}...`
                              : item.event.summary}
                          </span>
                          <span className="result-event-meta">
                            {item.matchedTopicName || item.event.category} · {item.event.source}
                          </span>
                        </div>
                        <span className="result-event-cue">INSPECT →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
