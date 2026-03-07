import 'server-only';

import type { KnowledgeResult } from './types';
import constantsData from '@/data/physics-constants.json';

interface PhysicsConstant {
  name: string;
  symbol: string;
  value: number;
  unit: string;
  description: string;
  content: string;
  category: string;
}

const constants = constantsData as PhysicsConstant[];

export function searchPhysicsConstants(query: string): KnowledgeResult[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  return constants
    .map((c) => {
      const searchable =
        `${c.name} ${c.symbol} ${c.category} ${c.description} ${c.content}`.toLowerCase();
      const matched = terms.filter((t) => searchable.includes(t)).length;
      const relevance = terms.length > 0 ? matched / terms.length : 0;
      return {
        content: c.content,
        source: `physics-constant:${c.symbol}`,
        relevance,
      };
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);
}

export function getConstantBySymbol(symbol: string): KnowledgeResult | null {
  const c = constants.find(
    (c) => c.symbol === symbol || c.name.toLowerCase() === symbol.toLowerCase()
  );
  if (!c) return null;
  return {
    content: c.content,
    source: `physics-constant:${c.symbol}`,
    relevance: 1,
  };
}
