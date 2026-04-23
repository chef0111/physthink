import { allTools } from '../agent/tools';

export type ChatCapability = 'default' | 'threejs';

type CapabilityResolution = {
  capability: ChatCapability;
  unknownRequested: boolean;
  requestedRaw: string | null;
};

const THREEJS_TOOL_NAMES: Array<keyof typeof allTools> = [
  'addElement',
  'addElements',
  'editElement',
  'removeElement',
  'setSceneSettings',
];

export function resolveCapabilityIntent(
  capabilityIntent: unknown
): CapabilityResolution {
  if (typeof capabilityIntent !== 'string') {
    return {
      capability: 'default',
      unknownRequested: false,
      requestedRaw: null,
    };
  }

  const normalized = capabilityIntent.trim().toLowerCase();
  if (!normalized) {
    return {
      capability: 'default',
      unknownRequested: false,
      requestedRaw: null,
    };
  }

  if (normalized === 'threejs') {
    return {
      capability: 'threejs',
      unknownRequested: false,
      requestedRaw: normalized,
    };
  }

  return {
    capability: 'default',
    unknownRequested: true,
    requestedRaw: normalized,
  };
}

export function getCapabilityAllowedTools(
  capability: ChatCapability,
  availableToolNames?: string[]
): Array<keyof typeof allTools> {
  const allToolNames = (availableToolNames ?? Object.keys(allTools)) as Array<
    keyof typeof allTools
  >;

  if (capability === 'threejs') {
    return THREEJS_TOOL_NAMES;
  }
  return allToolNames;
}

export function getCapabilitySystemContext(
  capability: ChatCapability,
  unknownRequested: boolean,
  requestedRaw: string | null
): string {
  const sections: string[] = [];

  if (capability === 'threejs') {
    sections.push(
      [
        '## Capability Mode: threejs',
        '- Focus on building 3D scene content with scene tools only.',
        '- Prefer concrete geometry, vectors, labels, and scene settings.',
        '- Avoid non-scene knowledge tools unless explicitly enabled.',
      ].join('\n')
    );
  }

  if (unknownRequested) {
    sections.push(
      [
        '## Capability Request Warning',
        `- Unsupported capability requested: ${requestedRaw ?? 'unknown'}.`,
        '- Do not call tools for this unsupported capability request.',
        '- Respond with a safe plain-text explanation and suggest supported capability names.',
      ].join('\n')
    );
  }

  return sections.join('\n\n');
}
