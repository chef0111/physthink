import 'server-only';

import { tool } from 'ai';
import { z } from 'zod';
import {
  searchPhysicsConstants,
  getConstantBySymbol,
} from '@/lib/knowledge/physics-provider';
import { searchThreeJsDocs } from '@/lib/knowledge/threejs-provider';
import {
  searchPatterns,
  getPatternByName,
} from '@/lib/knowledge/patterns-provider';
import {
  getProblemExampleByKey,
  getProblemRagStats,
  searchProblemExamples,
} from '@/lib/knowledge/problem-rag-provider';

const ALLOWED_DOMAINS = [
  'en.wikipedia.org',
  'en.m.wikipedia.org',
  'developer.mozilla.org',
  'threejs.org',
  'docs.pmnd.rs',
  'r3f.docs.pmnd.rs',
  'hyperphysics.phy-astr.gsu.edu',
];

const MAX_CONTENT_LENGTH = 4000;

export const knowledgeTools = {
<<<<<<< Updated upstream:app/server/workspace/chat-tools/knowledge-tools.ts
  lookupPhysics: tool({
    description:
      'Look up a physics constant, formula, or concept by symbol or keyword. Use ONLY for uncommon constants you genuinely do not know (e.g. electron mass, Boltzmann constant, drag coefficients). Do NOT use for common values like g, c, pi, or basic formulas you already know.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The constant symbol, name, or topic (e.g. "electron mass", "Boltzmann constant", "drag coefficient")'
        ),
    }),
    execute: async ({ query }) => {
      const exact = getConstantBySymbol(query);
      if (exact) return { found: true, results: [exact] };
      const results = searchPhysicsConstants(query);
      if (results.length > 0) return { found: true, results };
      return {
        found: false,
        results: [],
        message: `No results for "${query}"`,
=======
  searchProblemExamples: tool({
    description:
      'Retrieve similar solved physics-problem examples from the local RAG corpus (lesson + extracted graph + SVG). Use this first when the student gives a textbook-like mechanics problem so you can follow proven graph/diagram patterns.',
    inputSchema: z.object({
      query: z
        .string()
        .describe('The current student problem text to retrieve similar examples'),
      topK: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .default(3)
        .describe('How many similar examples to retrieve'),
      category: z
        .string()
        .optional()
        .describe(
          'Optional category filter (e.g. stack_objects, slide_objects, collision_objects)'
        ),
      includeSvg: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to include truncated SVG snippets'),
    }),
    execute: async ({ query, topK, category, includeSvg }) => {
      const results = searchProblemExamples(query, {
        topK,
        category,
        includeSvg,
      });
      const stats = getProblemRagStats();
      return {
        query,
        count: results.length,
        totalSamples: stats.totalSamples,
        categories: stats.categories,
        results,
      };
    },
  }),

  getProblemExampleByKey: tool({
    description:
      'Get one full RAG sample by key from the local corpus, including lesson, graph text, and SVG. Use after searchProblemExamples when you need full details from a specific retrieved example.',
    inputSchema: z.object({
      key: z
        .string()
        .describe('Sample key, e.g. "stack_objects/prob1" from search results'),
    }),
    execute: async ({ key }) => {
      const sample = getProblemExampleByKey(key);
      if (!sample) {
        return {
          found: false,
          content: `No local problem sample found for key "${key}"`,
          source: 'problem-rag',
        };
      }
      return {
        found: true,
        source: 'problem-rag',
        sample,
>>>>>>> Stashed changes:app/api/workspace/chat/tools/knowledge-tools.ts
      };
    },
  }),

  getPhysicsConstants: tool({
    description:
      'Look up a physics constant by its symbol or name. Use when the student mentions a constant (g, c, h, e, k_B, etc.) or you need its value for an illustration label.',
    inputSchema: z.object({
      symbol: z
        .string()
        .describe(
          'The symbol or name of the constant (e.g. "g", "c", "Boltzmann constant")'
        ),
    }),
    execute: async ({ symbol }) => {
      const result = getConstantBySymbol(symbol);
      if (result) return { found: true, ...result };
      // Fallback to search
      const results = searchPhysicsConstants(symbol);
      if (results.length > 0) return { found: true, ...results[0] };
      return {
        found: false,
        content: `No constant found for "${symbol}"`,
        source: 'physics-constants',
      };
    },
  }),

  searchPhysicsKnowledge: tool({
    description:
      'Search the physics knowledge base for information relevant to a topic. Returns matching physics constants and formulas. Use when you need background physics context for a problem.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Natural language query about a physics topic (e.g. "friction on inclined plane")'
        ),
    }),
    execute: async ({ query }) => {
      const results = searchPhysicsConstants(query);
      return { results, count: results.length };
    },
  }),

  searchThreeJsDocs: tool({
    description:
      'Search Three.js / R3F documentation for information about geometries, materials, lights, or cameras. Use when you need to look up correct geometry arguments, material properties, or lighting setup.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Search query about Three.js features (e.g. "cylinder geometry arguments")'
        ),
    }),
    execute: async ({ query }) => {
      const results = searchThreeJsDocs(query);
      return { results, count: results.length };
    },
  }),

  getInteractionPattern: tool({
    description:
      'Retrieve a physics illustration pattern — a step-by-step guide for building a specific type of physics scene (e.g. free-body diagram on inclined plane, projectile motion, Atwood machine, spring-mass system). Use this before building a scene to follow best practices.',
    inputSchema: z.object({
      name: z
        .string()
        .describe(
          'Pattern name or keyword (e.g. "inclined plane", "projectile", "pulley", "spring")'
        ),
    }),
    execute: async ({ name }) => {
      const result = getPatternByName(name);
      if (result) return { found: true, ...result };
      const results = searchPatterns(name);
      if (results.length > 0) return { found: true, ...results[0] };
      return {
        found: false,
        content: `No pattern found for "${name}"`,
        source: 'patterns',
      };
    },
  }),

  fetchWebContent: tool({
    description:
      'Fetch content from a trusted educational URL for additional physics reference material. Only allowed domains: Wikipedia, MDN, threejs.org, R3F docs, HyperPhysics. Use when you need supplementary information not in the local knowledge base.',
    inputSchema: z.object({
      url: z
        .url()
        .describe(
          'The URL to fetch content from (must be from an allowed domain)'
        ),
    }),
    execute: async ({ url }) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return { error: 'Invalid URL', content: '' };
      }

      if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
        return {
          error: `Domain "${parsed.hostname}" is not in the allowlist. Allowed: ${ALLOWED_DOMAINS.join(', ')}`,
          content: '',
        };
      }

      // Block non-HTTPS
      if (parsed.protocol !== 'https:') {
        return { error: 'Only HTTPS URLs are allowed', content: '' };
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'PhysThink/1.0 (educational-bot)' },
          redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!res.ok) {
          return { error: `HTTP ${res.status}`, content: '' };
        }

        const text = await res.text();

        // Strip HTML tags for a rough text extraction
        const stripped = text
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const truncated =
          stripped.length > MAX_CONTENT_LENGTH
            ? stripped.slice(0, MAX_CONTENT_LENGTH) + '... (truncated)'
            : stripped;

        return { content: truncated, source: url };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : 'Fetch failed',
          content: '',
        };
      }
    },
  }),
};
