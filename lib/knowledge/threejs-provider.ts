import 'server-only';

import type { KnowledgeResult } from './types';
import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.join(process.cwd(), 'data', 'threejs-docs');

let cachedDocs: Array<{ filename: string; content: string }> | null = null;

function loadDocs(): Array<{ filename: string; content: string }> {
  if (cachedDocs) return cachedDocs;

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md'));
  cachedDocs = files.map((f) => ({
    filename: f,
    content: fs.readFileSync(path.join(DOCS_DIR, f), 'utf-8'),
  }));
  return cachedDocs;
}

export function searchThreeJsDocs(query: string): KnowledgeResult[] {
  const docs = loadDocs();
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  return docs
    .map((doc) => {
      const searchable = doc.content.toLowerCase();
      const matched = terms.filter((t) => searchable.includes(t)).length;
      const relevance = terms.length > 0 ? matched / terms.length : 0;
      return {
        content: doc.content,
        source: `threejs-docs:${doc.filename}`,
        relevance,
      };
    })
    .filter((r) => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
}
