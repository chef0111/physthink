'use client';

import { useMemo, Component, type ReactNode } from 'react';
import { Text } from '@react-three/drei';
import { transform } from 'sucrase';
import * as THREE from 'three';
import * as Drei from '@react-three/drei';
import * as Fiber from '@react-three/fiber';
import * as React from 'react';
import type { CustomElement } from '@/lib/stores/scene-store';

// Allowlisted modules for custom code execution
const ALLOWED_IMPORTS: Record<string, unknown> = {
  three: THREE,
  '@react-three/drei': Drei,
  '@react-three/fiber': Fiber,
  react: React,
};

class CustomElementErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <Text fontSize={0.15} color="#ff4444" anchorX="center" anchorY="middle">
          {`Error: ${this.state.error.slice(0, 80)}`}
        </Text>
      );
    }
    return this.props.children;
  }
}

function scopedRequire(name: string): unknown {
  if (name in ALLOWED_IMPORTS) {
    return ALLOWED_IMPORTS[name];
  }
  throw new Error(`Import "${name}" is not allowed in custom elements`);
}

export function CustomElementRenderer({ element }: { element: CustomElement }) {
  const RenderedComponent = useMemo(() => {
    if (!element.code) return null;

    try {
      const transpiled = transform(element.code, {
        transforms: ['jsx', 'typescript', 'imports'],
        jsxRuntime: 'classic',
        jsxPragma: 'React.createElement',
        jsxFragmentPragma: 'React.Fragment',
        production: true,
      }).code;

      // Create a sandboxed function with limited scope
      const fn = new Function(
        'require',
        'React',
        'THREE',
        `${transpiled}\nreturn typeof CustomElement !== 'undefined' ? CustomElement : null;`
      );

      return fn(scopedRequire, React, THREE);
    } catch (err) {
      console.warn('Custom element transpile error:', err);
      return null;
    }
  }, [element.code]);

  if (element.visible === false) return null;

  if (!RenderedComponent) {
    return (
      <group>
        <Text fontSize={0.15} color="#ff8800" anchorX="center" anchorY="middle">
          Invalid custom element
        </Text>
      </group>
    );
  }

  return (
    <group>
      <CustomElementErrorBoundary>
        <RenderedComponent />
      </CustomElementErrorBoundary>
    </group>
  );
}
