import { prisma } from '@/lib/prisma';
import type { ChatStreamLogger } from './logging';

type ExtractScenePersistenceDataParams = {
  assistantPartsRaw: Array<Record<string, unknown>>;
  workspaceId: string;
  logger: ChatStreamLogger;
};

function getElementFingerprint(e: Record<string, unknown>) {
  const pos = (e.position as number[]) ?? [0, 0, 0];
  const roundedPosition = pos.map((v) => Math.round((v as number) * 100) / 100);
  let fingerprint = `${e.type}|${roundedPosition.join(',')}`;

  if (e.type === 'preset') fingerprint += `|${e.presetId ?? ''}`;
  else if (e.type === 'mesh') fingerprint += `|${e.geometry ?? ''}`;
  else if (e.type === 'vector') {
    const to = (e.to as number[]) ?? [0, 0, 0];
    fingerprint += `|${to.map((v) => Math.round(v * 100) / 100).join(',')}`;
  }

  return fingerprint;
}

export async function extractScenePersistenceData({
  assistantPartsRaw,
  workspaceId,
  logger,
}: ExtractScenePersistenceDataParams): Promise<unknown | null> {
  let persistedSceneData: unknown = null;

  try {
    const newElements: unknown[] = [];
    let newSceneSettings: Record<string, unknown> | null = null;

    for (const part of assistantPartsRaw) {
      if (part.toolName === 'addElements' || part.toolName === 'addElement') {
        const output = part.output as Record<string, unknown> | undefined;
        if (Array.isArray(output?.elements)) {
          newElements.push(...(output.elements as unknown[]));
        } else if (output?.element) {
          newElements.push(output.element);
        }
      } else if (part.toolName === 'setSceneSettings') {
        const output = part.output as Record<string, unknown> | undefined;
        if (output?.settings) {
          newSceneSettings = output.settings as Record<string, unknown>;
        }
      }
    }

    logger.logSceneProcessingStart(newElements.length, !!newSceneSettings);

    if (newElements.length > 0 || newSceneSettings) {
      const current = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { sceneData: true },
      });
      const scene = (current?.sceneData ?? {}) as {
        elements?: unknown[];
        sceneSettings?: Record<string, unknown>;
      };
      const existingElements = Array.isArray(scene.elements)
        ? scene.elements
        : [];
      const existingSettings = scene.sceneSettings ?? {};

      const existingFingerprints = new Set(
        existingElements.map((el) =>
          getElementFingerprint(el as Record<string, unknown>)
        )
      );

      const dedupedElements = newElements.filter((el) => {
        const fingerprint = getElementFingerprint(
          el as Record<string, unknown>
        );
        if (existingFingerprints.has(fingerprint)) return false;
        existingFingerprints.add(fingerprint);
        return true;
      });

      logger.logSceneDeduplication(
        newElements.length,
        dedupedElements.length,
        existingElements.length
      );

      if (dedupedElements.length > 0 || newSceneSettings) {
        const updatedElements = [
          ...existingElements,
          ...dedupedElements.map((el) => ({
            ...(el as Record<string, unknown>),
            id: crypto.randomUUID(),
          })),
        ];

        persistedSceneData = JSON.parse(
          JSON.stringify({
            elements: updatedElements,
            sceneSettings: newSceneSettings
              ? { ...existingSettings, ...newSceneSettings }
              : existingSettings,
          })
        );
      }
    }

    logger.logSceneProcessingEnd();
  } catch (sceneErr) {
    logger.logFinishError(
      sceneErr instanceof Error ? sceneErr : new Error(String(sceneErr)),
      'scene_processing_prepare'
    );
  }

  return persistedSceneData;
}
