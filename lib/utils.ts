import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isDev = process.env.NODE_ENV !== 'production';

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / k ** i).toFixed(dm)) + sizes[i];
};

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function formatArgValue(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) {
    if (value.length <= 4 && value.every((v) => typeof v === 'number'))
      return `[${value.join(', ')}]`;
    return `[${value.length} items]`;
  }
  if (typeof value === 'object' && depth < 1) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .slice(0, 6)
      .map(([k, v]) => `${k}: ${formatArgValue(v, depth + 1)}`)
      .join(', ');
  }
  return '{...}';
}

export function preprocessMath(content: string): string {
  // \[...\] → $$...$$ (display math)
  content = content.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, inner: string) => `$$${inner}$$`
  );
  // \(...\) → $...$ (inline math)
  content = content.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, inner: string) => `$${inner}$`
  );
  // $ \theta = ... $ -> $\theta = ...$ so markdown math parser recognizes it.
  content = content.replace(
    /\$\s*([^$\n]*\\[A-Za-z][^$\n]*?)\s*\$/g,
    (_, inner: string) => `$${inner.trim()}$`
  );
  // $$ \int ... $$ -> $$\int ...$$ for display expressions with extra spaces.
  content = content.replace(
    /\$\$\s*([\s\S]*\\[A-Za-z][\s\S]*?)\s*\$\$/g,
    (_, inner: string) => `$$${inner.trim()}$$`
  );
  // ( ...\sin... ) -> $...$ for common model outputs that omit math delimiters.
  content = content.replace(
    /\(([^()\n]*\\[A-Za-z]+[^()\n]*)\)/g,
    (_, inner: string) => `$${inner}$`
  );
  return content;
}

export function isEditorEmpty(content: string | null | undefined): boolean {
  if (!content) return true;
  try {
    const parsed = JSON.parse(content);
    if (!parsed?.root?.children) return false;
    const children = parsed.root.children;
    if (children.length === 0) return true;
    if (
      children.length === 1 &&
      children[0].type === 'paragraph' &&
      (!children[0].children || children[0].children.length === 0)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
