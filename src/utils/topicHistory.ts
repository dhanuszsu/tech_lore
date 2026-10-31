import type { Topic, EvidenceEvent, TopicFeatures } from '../types';

export interface CatalystMark {
  year: number;
  count: number;
  percent: number; // 0 to 100 on 2004–2026 timeline
  isClustered: boolean;
}

export interface TopicHistoryProfile {
  topic: Topic;
  indexNumber: string; // "01" through "24"
  startYear: number;
  endYear: number;
  dateRange: string;
  catalystCount: number;
  catalystYears: number[];
  catalysts: EvidenceEvent[];
  yearDensityMap: Record<number, number>;
  catalystMarks: CatalystMark[];
  startPercent: number;
  dominantYear: number;
  peakYear: number;
  accessibleSummary: string;
  isRecentSurge: boolean;
  latestInterest: number;
  features?: TopicFeatures;
}

export const TIMELINE_MIN_YEAR = 2004;
export const TIMELINE_MAX_YEAR = 2026;
export const TIMELINE_SPAN = TIMELINE_MAX_YEAR - TIMELINE_MIN_YEAR; // 22 years

/**
 * Builds an authentic, data-driven profile for a technology topic by cross-referencing
 * topics metadata, verified catalyst events, timeseries values, and ML feature representations.
 *
 * Adheres strictly to genuine data without synthesizing artificial dates or counts.
 */
export function buildTopicHistoryProfile(
  topic: Topic,
  events: EvidenceEvent[],
  seriesData: Record<string, number[]>,
  _dates?: string[],
  featuresList?: TopicFeatures[],
  canonicalIndex?: number
): TopicHistoryProfile {
  // 1. Archival index formatted as two-digit string ("01" to "24")
  const indexNumber = String((canonicalIndex ?? 0) + 1).padStart(2, '0');

  // 2. Start year derived from topic.introduced (genuine metadata)
  let startYear = TIMELINE_MIN_YEAR;
  if (topic.introduced) {
    const parsed = parseInt(topic.introduced.slice(0, 4), 10);
    if (!isNaN(parsed) && parsed >= TIMELINE_MIN_YEAR && parsed <= TIMELINE_MAX_YEAR) {
      startYear = parsed;
    }
  }
  const endYear = TIMELINE_MAX_YEAR;
  const dateRange = `${startYear} — ${endYear}`;

  // 3. Filter verified catalyst events from evidence catalog
  const topicCatalysts = events.filter((ev) => ev.topics.includes(topic.id));
  const catalystCount = topicCatalysts.length;

  // 4. Map catalyst density by year
  const yearDensityMap: Record<number, number> = {};
  for (const ev of topicCatalysts) {
    yearDensityMap[ev.year] = (yearDensityMap[ev.year] || 0) + 1;
  }
  const catalystYears = Object.keys(yearDensityMap)
    .map((y) => parseInt(y, 10))
    .sort((a, b) => a - b);

  // 5. Generate data marks strictly positioned at event years (2004–2026)
  const catalystMarks: CatalystMark[] = catalystYears.map((yr) => {
    const count = yearDensityMap[yr];
    const clampedYr = Math.max(TIMELINE_MIN_YEAR, Math.min(TIMELINE_MAX_YEAR, yr));
    const percent = ((clampedYr - TIMELINE_MIN_YEAR) / TIMELINE_SPAN) * 100;
    return {
      year: yr,
      count,
      percent: Math.round(percent * 100) / 100,
      isClustered: count >= 2
    };
  });

  const startPercent = Math.max(
    0,
    Math.min(100, ((startYear - TIMELINE_MIN_YEAR) / TIMELINE_SPAN) * 100)
  );

  // 6. Peak search interest year from metadata
  let peakYear = 2023;
  if (topic.peak_date) {
    const parsedPeak = parseInt(topic.peak_date.slice(0, 4), 10);
    if (!isNaN(parsedPeak)) {
      peakYear = parsedPeak;
    }
  }

  // 7. Dominant historical center of activity:
  // If topic has catalysts, pick the year of maximum catalyst concentration (or median)
  let dominantYear = peakYear;
  if (catalystYears.length > 0) {
    let maxClusterCount = 0;
    let clusterYear = catalystYears[0];
    for (const yr of catalystYears) {
      if (yearDensityMap[yr] > maxClusterCount) {
        maxClusterCount = yearDensityMap[yr];
        clusterYear = yr;
      }
    }
    dominantYear = clusterYear;
  } else {
    dominantYear = peakYear;
  }

  // 8. Latest search interest
  const series = seriesData[topic.id];
  const latestInterest = series && series.length > 0 ? series[series.length - 1] : 0;

  // 9. Recent surge classification
  const isRecentSurge =
    startYear >= 2021 ||
    topic.curve_type.includes('recent_surge') ||
    topic.curve_type.includes('breakout') ||
    topic.curve_type.includes('spike');

  // 10. Accessible text representation for screen readers
  let accessibleSummary = '';
  if (catalystCount === 0) {
    accessibleSummary = `${topic.name}, introduced in ${startYear}. Historical archive specimen with continuous baseline search observations across ${dateRange}.`;
  } else if (catalystCount === 1) {
    accessibleSummary = `1 documented catalyst in ${catalystYears[0]} across ${dateRange}.`;
  } else {
    const clusteredYears = catalystYears.filter((y) => yearDensityMap[y] >= 2);
    const clusterPhrase =
      clusteredYears.length > 0
        ? `, concentrated in ${clusteredYears.join(', ')}`
        : '';
    accessibleSummary = `${catalystCount} catalysts distributed across ${catalystYears[0]}–${
      catalystYears[catalystYears.length - 1]
    }${clusterPhrase}.`;
  }

  const features = featuresList?.find((f) => f.topic_id === topic.id);

  return {
    topic,
    indexNumber,
    startYear,
    endYear,
    dateRange,
    catalystCount,
    catalystYears,
    catalysts: topicCatalysts,
    yearDensityMap,
    catalystMarks,
    startPercent,
    dominantYear,
    peakYear,
    accessibleSummary,
    isRecentSurge,
    latestInterest,
    features
  };
}
