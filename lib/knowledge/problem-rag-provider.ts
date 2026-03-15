import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

const DATA_ROOT = path.join(process.cwd(), 'data');

export interface ProblemRagSample {
  key: string;
  category: string;
  sampleId: string;
  lesson: string;
  graph: string;
  svg: string;
  paths: {
    lessonJson: string;
    graphTxt: string;
    svgFile: string;
  };
}

export interface ProblemRagSearchItem {
  key: string;
  category: string;
  sampleId: string;
  score: number;
  lesson: string;
  graph: string;
  svg?: string;
  paths: ProblemRagSample['paths'];
}

interface IndexedSample extends ProblemRagSample {
  lessonTokens: Set<string>;
  graphTokens: Set<string>;
  lessonTextLower: string;
  graphTextLower: string;
}

interface SearchOptions {
  topK?: number;
  category?: string;
  includeSvg?: boolean;
  lessonChars?: number;
  graphChars?: number;
  svgChars?: number;
}

let cachedSamples: IndexedSample[] | null = null;

export function getProblemRagIndexState() {
  return {
    cached: cachedSamples !== null,
    dataRoot: DATA_ROOT,
  };
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 1);
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}... (truncated)`;
}

function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8').trim();
}

function findGraphFile(dirPath: string, stem: string): string | null {
  const direct = path.join(dirPath, `${stem}_graph.txt`);
  if (fs.existsSync(direct)) return direct;

  const candidates = fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith('_graph.txt'));
  if (candidates.length === 0) return null;

  const exact = candidates.find((name) => name.includes(stem));
  return path.join(dirPath, exact ?? candidates[0]);
}

function findSvgFile(dirPath: string, stem: string): string | null {
  const direct = path.join(dirPath, `${stem}.svg`);
  if (fs.existsSync(direct)) return direct;

  const candidates = fs.readdirSync(dirPath).filter((name) => name.endsWith('.svg'));
  if (candidates.length === 0) return null;

  const exact = candidates.find((name) => name === `${stem}.svg`);
  const partial = candidates.find((name) => name.includes(stem));
  return path.join(dirPath, exact ?? partial ?? candidates[0]);
}

function toRelativePath(filePath: string): string {
  return filePath.replace(`${process.cwd()}${path.sep}`, '').replaceAll('/', '\\');
}

function discoverSamples(): IndexedSample[] {
  if (!fs.existsSync(DATA_ROOT)) return [];

  const categoryDirs = fs
    .readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('_objects'))
    .map((entry) => entry.name);

  const all: IndexedSample[] = [];

  for (const category of categoryDirs) {
    const categoryPath = path.join(DATA_ROOT, category);
    const problemDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const problemDir of problemDirs) {
      const problemPath = path.join(categoryPath, problemDir);
      const jsonFiles = fs.readdirSync(problemPath).filter((name) => name.endsWith('.json'));

      for (const jsonFile of jsonFiles) {
        const lessonPath = path.join(problemPath, jsonFile);
        const stem = path.parse(jsonFile).name;

        let payload: { id?: string; lesson?: string };
        try {
          payload = JSON.parse(readText(lessonPath));
        } catch {
          continue;
        }

        const lesson = String(payload.lesson ?? '').trim();
        if (!lesson) continue;

        const graphPath = findGraphFile(problemPath, stem);
        const svgPath = findSvgFile(problemPath, stem);
        if (!graphPath || !svgPath) continue;

        const graph = readText(graphPath);
        const svg = readText(svgPath);
        if (!graph || !svg) continue;

        const sampleId = String(payload.id ?? stem).trim() || stem;
        const key = `${category}/${sampleId}`;

        all.push({
          key,
          category,
          sampleId,
          lesson,
          graph,
          svg,
          paths: {
            lessonJson: toRelativePath(lessonPath),
            graphTxt: toRelativePath(graphPath),
            svgFile: toRelativePath(svgPath),
          },
          lessonTokens: new Set(tokenize(lesson)),
          graphTokens: new Set(tokenize(graph)),
          lessonTextLower: normalizeText(lesson),
          graphTextLower: normalizeText(graph),
        });
      }
    }
  }

  return all.sort((a, b) => a.key.localeCompare(b.key));
}

function getIndexedSamples(): IndexedSample[] {
  if (cachedSamples) return cachedSamples;
  cachedSamples = discoverSamples();
  return cachedSamples;
}

function scoreSample(query: string, queryTokens: Set<string>, sample: IndexedSample): number {
  if (queryTokens.size === 0) return 0;

  let score = 0;
  for (const token of queryTokens) {
    if (sample.lessonTokens.has(token)) score += 2;
    if (sample.graphTokens.has(token)) score += 1;
  }

  if (query.length > 6 && sample.lessonTextLower.includes(query)) {
    score += 2;
  }
  if (query.length > 6 && sample.graphTextLower.includes(query)) {
    score += 1;
  }

  return score / (queryTokens.size * 3);
}

export function searchProblemExamples(
  query: string,
  options: SearchOptions = {}
): ProblemRagSearchItem[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const topK = Math.min(Math.max(options.topK ?? 3, 1), 10);
  const lessonChars = options.lessonChars ?? 1200;
  const graphChars = options.graphChars ?? 2000;
  const svgChars = options.svgChars ?? 1000;
  const queryTokens = new Set(tokenize(normalizedQuery));

  const rows = getIndexedSamples()
    .filter((sample) => !options.category || sample.category === options.category)
    .map((sample) => ({ sample, score: scoreSample(normalizedQuery, queryTokens, sample) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return rows.map(({ sample, score }) => ({
    key: sample.key,
    category: sample.category,
    sampleId: sample.sampleId,
    score: Number(score.toFixed(4)),
    lesson: truncate(sample.lesson, lessonChars),
    graph: truncate(sample.graph, graphChars),
    ...(options.includeSvg ? { svg: truncate(sample.svg, svgChars) } : {}),
    paths: sample.paths,
  }));
}

export function getProblemExampleByKey(key: string): ProblemRagSample | null {
  const normalizedKey = key.trim();
  if (!normalizedKey) return null;

  const sample = getIndexedSamples().find((item) => item.key === normalizedKey);
  if (!sample) return null;

  const { lessonTokens, graphTokens, lessonTextLower, graphTextLower, ...result } = sample;
  void lessonTokens;
  void graphTokens;
  void lessonTextLower;
  void graphTextLower;
  return result;
}

export function getProblemRagStats() {
  const samples = getIndexedSamples();
  const byCategory = samples.reduce<Record<string, number>>((acc, sample) => {
    acc[sample.category] = (acc[sample.category] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalSamples: samples.length,
    categories: byCategory,
  };
}
