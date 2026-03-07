import 'server-only';

import { tool } from 'ai';
import { z } from 'zod';
import { transform } from 'sucrase';

const ALLOWED_IMPORTS = new Set([
  'three',
  '@react-three/fiber',
  '@react-three/drei',
  'react',
]);

export const codeTools = {
  validateCode: tool({
    description:
      'Validate a TypeScript/JSX code snippet for syntax correctness. Use this to check generated code for physics simulations before presenting it to the student. Returns syntax errors if any.',
    inputSchema: z.object({
      code: z.string().describe('The TypeScript/JSX code to validate'),
    }),
    execute: async ({ code }) => {
      // Check for disallowed imports
      const importMatches = code.matchAll(
        /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g
      );
      const disallowed: string[] = [];
      for (const match of importMatches) {
        const pkg = match[1];
        // Allow relative imports and allowed packages
        if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
          const root = pkg.startsWith('@')
            ? pkg.split('/').slice(0, 2).join('/')
            : pkg.split('/')[0];
          if (!ALLOWED_IMPORTS.has(root)) {
            disallowed.push(pkg);
          }
        }
      }

      if (disallowed.length > 0) {
        return {
          valid: false,
          error: `Disallowed imports: ${disallowed.join(', ')}. Only ${[...ALLOWED_IMPORTS].join(', ')} and relative imports are allowed.`,
        };
      }

      try {
        transform(code, {
          transforms: ['typescript', 'jsx'],
          jsxRuntime: 'automatic',
        });
        return { valid: true, error: null };
      } catch (e) {
        return {
          valid: false,
          error: e instanceof Error ? e.message : 'Syntax error',
        };
      }
    },
  }),
};
