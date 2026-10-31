import type { Topic, EvidenceEvent } from '../types';

export interface TopicSearchResult {
  topic: Topic;
  indexNumber: string;
  startYear: number;
  dateRange: string;
  catalystCount: number;
  matchedField: string;
}

export interface EvidenceSearchResult {
  event: EvidenceEvent;
  matchedTopicName?: string;
  matchedField: string;
}

export interface SearchResults {
  topics: TopicSearchResult[];
  events: EvidenceSearchResult[];
  totalMatches: number;
}

// Canonical topic aliases & keywords for fast domain matching
const TOPIC_ALIASES: Record<string, string[]> = {
  large_language_models: ['llm', 'llms', 'large language', 'foundation models', 'gpt-4', 'gpt-3', 'llama', 'gemini'],
  generative_ai: ['genai', 'generative', 'synthetic media', 'multimodal', 'diffusion'],
  prompt_engineering: ['prompt', 'prompting', 'in-context learning', 'few-shot', 'system prompt'],
  ai_agents: ['agent', 'agents', 'autonomous', 'tool use', 'agentic', 'swe-bench', 'workflow'],
  agi: ['agi', 'general intelligence', 'human level', 'singularity'],
  stable_diffusion: ['diffusion', 'latent diffusion', 'stability ai', 'runway', 'image generation'],
  midjourney: ['midjourney', 'mj', 'generative art', 'v6', 'photorealism'],
  deep_learning: ['deep learning', 'dl', 'backprop', 'hinton', 'bengio', 'lecun', 'neural net'],
  transformer_model: ['transformer', 'transformers', 'attention', 'attention is all you need', 'vaswani', 'self-attention'],
  convolutional_neural_network: ['cnn', 'convnet', 'convolutional', 'alexnet', 'resnet', 'vision'],
  bert: ['bert', 'bidirectional', 'masked language model', 'google research', 'devlin'],
  reinforcement_learning: ['rl', 'reinforcement', 'q-learning', 'policy gradient', 'reward', 'deepmind', 'alphazero'],
  alphago: ['alphago', 'go', 'lee sedol', 'deepmind', 'silver', 'mcts', 'silver et al'],
  machine_learning: ['ml', 'machine learning', 'empirical', 'statistical inference'],
  natural_language_processing: ['nlp', 'natural language', 'linguistics', 'semantics', 'syntax'],
  computer_vision: ['cv', 'computer vision', 'vision', 'image recognition', 'visual recognition'],
  expert_systems: ['expert systems', 'symbolic ai', 'rule based', 'inference engine', 'knowledge base'],
  support_vector_machines: ['svm', 'support vector', 'kernel trick', 'maximum margin', 'hyperplane'],
  neural_networks: ['neural networks', 'ann', 'perceptron', 'multilayer perceptron', 'weights'],
  data_science: ['data science', 'ds', 'analytics', 'statistics', 'data engineering'],
  robotics: ['robotics', 'robots', 'kinematics', 'actuation', 'boston dynamics', 'manipulation'],
  metaverse: ['metaverse', 'vr', 'virtual reality', 'meta', 'spatial', 'oculus'],
  quantum_computing: ['quantum', 'quantum computing', 'qubit', 'superposition', 'entanglement', 'quantum supremacy']
};

// Hardware / chip related terms for semantic catalyst discovery
const HARDWARE_TERMS = ['chip', 'chips', 'gpu', 'gpus', 'semiconductor', 'semiconductors', 'hardware', 'accelerator', 'accelerators', 'blackwell', 'dgx', 'tpu', 'nvidia'];

/**
 * Searches across topics metadata and verified historical catalyst events.
 * Fully case-insensitive, whitespace tolerant, and instant.
 */
export function searchTechLore(
  query: string,
  topics: Topic[],
  events: EvidenceEvent[]
): SearchResults {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { topics: [], events: [], totalMatches: 0 };
  }

  // 1. Search Topics
  const matchingTopics: TopicSearchResult[] = [];

  topics.forEach((topic, idx) => {
    const indexNumber = String(idx + 1).padStart(2, '0');
    const introYear = topic.introduced ? parseInt(topic.introduced.slice(0, 4), 10) : 2004;
    const startYear = isNaN(introYear) ? 2004 : introYear;
    const dateRange = `${startYear} — 2026`;
    const topicCatalysts = events.filter((e) => e.topics.includes(topic.id));

    const name = topic.name.toLowerCase();
    const id = topic.id.toLowerCase();
    const category = topic.category.toLowerCase();
    const description = topic.description.toLowerCase();
    const aliases = TOPIC_ALIASES[topic.id] || [];

    let matchedField = '';

    if (name.includes(trimmed)) {
      matchedField = 'name';
    } else if (id.includes(trimmed.replace(/\s+/g, '_'))) {
      matchedField = 'id';
    } else if (aliases.some((a) => a.includes(trimmed) || trimmed.includes(a))) {
      matchedField = 'alias';
    } else if (category.includes(trimmed)) {
      matchedField = 'category';
    } else if (description.includes(trimmed)) {
      matchedField = 'description';
    } else if (trimmed.length === 4 && !isNaN(Number(trimmed)) && (introYear === Number(trimmed) || topic.peak_date.startsWith(trimmed))) {
      matchedField = 'year';
    }

    if (matchedField) {
      matchingTopics.push({
        topic,
        indexNumber,
        startYear,
        dateRange,
        catalystCount: topicCatalysts.length,
        matchedField
      });
    }
  });

  // 2. Search Evidence Events
  const matchingEvents: EvidenceSearchResult[] = [];
  const isHardwareQuery = HARDWARE_TERMS.some((h) => trimmed.includes(h) || h.includes(trimmed));

  events.forEach((ev) => {
    const title = ev.title.toLowerCase();
    const summary = ev.summary.toLowerCase();
    const source = ev.source.toLowerCase();
    const category = ev.category.toLowerCase();
    const methodology = ev.methodology.toLowerCase();
    const yearStr = String(ev.year);

    let matchedField = '';

    if (title.includes(trimmed)) {
      matchedField = 'title';
    } else if (summary.includes(trimmed)) {
      matchedField = 'summary';
    } else if (yearStr === trimmed) {
      matchedField = 'year';
    } else if (isHardwareQuery && (category.includes('hardware') || title.includes('nvidia') || title.includes('gpu') || summary.includes('gpu') || summary.includes('accelerator'))) {
      matchedField = 'hardware/chip milestone';
    } else if (source.includes(trimmed)) {
      matchedField = 'source';
    } else if (category.includes(trimmed)) {
      matchedField = 'category';
    } else if (methodology.includes(trimmed)) {
      matchedField = 'methodology';
    }

    if (matchedField) {
      const primaryTopicObj = topics.find((t) => ev.topics.includes(t.id));
      matchingEvents.push({
        event: ev,
        matchedTopicName: primaryTopicObj?.name,
        matchedField
      });
    }
  });

  return {
    topics: matchingTopics,
    events: matchingEvents,
    totalMatches: matchingTopics.length + matchingEvents.length
  };
}
