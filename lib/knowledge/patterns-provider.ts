import 'server-only';

import type { KnowledgeResult } from './types';
import patternsData from '@/data/interaction-patterns.json';

interface InteractionPattern {
  name: string;
  category: string;
  tags: string[];
  content: string;
}

const patterns = patternsData as InteractionPattern[];

export function searchPatterns(query: string): KnowledgeResult[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  return patterns
    .map((p) => {
      const searchable =
        `${p.name} ${p.category} ${p.tags.join(' ')} ${p.content}`.toLowerCase();
      const matched = terms.filter((t) => searchable.includes(t)).length;
      const relevance = terms.length > 0 ? matched / terms.length : 0;
      return { content: p.content, source: `pattern:${p.name}`, relevance };
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}

export function getPatternByName(name: string): KnowledgeResult | null {
  const p = patterns.find(
    (p) =>
      p.name.toLowerCase().includes(name.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase() === name.toLowerCase())
  );
  if (!p) return null;
  return { content: p.content, source: `pattern:${p.name}`, relevance: 1 };
}
