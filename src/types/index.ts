export type CategoryBadge = 'yellow' | 'pink' | 'blue' | 'red' | 'green' | 'cyan' | 'magenta' | 'purple';

export interface Topic {
  id: string;
  name: string;
  category: string;
  introduced: string;
  color: string;
  description: string;
  curve_type: string;
  peak_date: string;
  peak_val: number;
  floor: number;
  stabilized_val: number;
}

export interface TopicFeatures {
  topic_id: string;
  cagr: number;
  max_acceleration: number;
  volatility: number;
  peak_intensity: number;
  persistence_months: number;
  decay_ratio: number;
  entropy: number;
  latest_interest: number;
  pca_x: number;
  pca_y: number;
  cluster_k4?: number;
}

export interface EvidenceEvent {
  id: string;
  date: string;
  year: number;
  title: string;
  category: string;
  category_badge: CategoryBadge;
  topics: string[];
  delta_velocity: string;
  confidence: number;
  source: string;
  source_url: string;
  summary: string;
  methodology: string;
}

export interface ClusterCentroid {
  cluster_index: number;
  size: number;
  topics: string[];
  cagr: number;
  max_acceleration: number;
  volatility: number;
  peak_intensity: number;
  persistence_months: number;
  decay_ratio: number;
}

export interface KMeansExport {
  feature_names: string[];
  silhouette_scores: Record<string, number>;
  best_k: number;
  explained_variance_ratio: number[];
  clusters_by_k: Record<string, ClusterCentroid[]>;
  assignments_by_k: Record<string, number[]>;
  topic_features: TopicFeatures[];
  archetype_definitions: Record<string, string>;
  limitations: string[];
}

export interface PipelineSummary {
  status: string;
  timestamp: string;
  topics_count: number;
  time_steps_per_topic: number;
  total_data_points: number;
  min_value: number;
  max_value: number;
  null_values_count: number;
  evidence_events_count: number;
  best_k_silhouette: number;
  pca_variance_retained: string;
  verification_tests: Array<{ test: string; passed: boolean }>;
}
