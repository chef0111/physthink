'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Link2,
  Package,
  Type,
  Grid3X3,
  Trash2,
  Sparkles,
  Undo2,
  Redo2,
} from 'lucide-react';
import { nanoid } from 'nanoid/non-secure';
import { cn } from '@/lib/utils';
import { useSceneStore } from '@/stores/scene-store';
import type {
  ActiveTool,
  MeshElement,
  SceneElement,
  Vec3,
} from '@/stores/scene-store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Kbd } from '@/components/ui/kbd';
import { useSidebar } from '@/components/ui/sidebar';
import { toolGroups } from '@/common/constants/workspace';
import { Card } from '@/components/ui/card';

function createDefaultElement(
  tool: ActiveTool,
  subTool: string | null
): SceneElement | null {
  const id = nanoid(10);
  const base = {
    id,
    position: [0, 0.5, 0] as Vec3,
    rotation: [0, 0, 0] as Vec3,
    scale: [1, 1, 1] as Vec3,
    visible: true,
  };

  switch (tool) {
    case 'add-primitive':
      return {
        ...base,
        type: 'mesh' as const,
        geometry: (subTool ?? 'box') as MeshElement['geometry'],
      };
    case 'add-vector':
      return {
        ...base,
        type: 'vector',
        from: [0, 0, 0],
        to: [1, 1, 0],
        color: '#f73939',
      };
    case 'add-connector':
      return {
        ...base,
        type: 'connector',
        connector: (subTool as 'spring' | 'rope' | 'rod' | 'wire') ?? 'spring',
        start: [0, 0, 0],
        end: [0, 2, 0],
      };
    case 'add-curve':
      return {
        ...base,
        type: 'curve',
        points: [
          [0, 0, 0],
          [1, 1, 0],
          [2, 0, 0],
        ],
        color: '#66bb6a',
      };
    case 'add-preset':
      return subTool
        ? {
            ...base,
            type: 'preset',
            presetId: subTool,
          }
        : null;
    case 'add-annotation':
      return {
        ...base,
        type: 'annotation',
        annotationKind:
          (subTool as
            | 'label'
            | 'angle-marker'
            | 'dimension'
            | 'coordinate-axes'
            | 'region') ?? 'label',
        text: 'Label',
      };
    default:
      return null;
  }
}

export function WorkspaceToolbar() {
  const activeTool = useSceneStore((s) => s.activeTool);
  const activeSubTool = useSceneStore((s) => s.activeSubTool);
  const setActiveTool = useSceneStore((s) => s.setActiveTool);
  const addElement = useSceneStore((s) => s.addElement);
  const removeElement = useSceneStore((s) => s.removeElement);
  const selectedId = useSceneStore((s) => s.selectedId);
  const sceneSettings = useSceneStore((s) => s.sceneSettings);
  const setSceneSettings = useSceneStore((s) => s.setSceneSettings);

  const { setOpen: setSidebarOpen } = useSidebar();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const handleAiShortcut = useCallback(() => {
    setSidebarOpen(true);
    // Focus the chat textarea after sidebar opens
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        '[data-slot="sidebar"] textarea'
      );
      textarea?.focus();
    }, 200);
  }, [setSidebarOpen]);

  // Ctrl+J keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleAiShortcut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAiShortcut]);

  const handleToolClick = useCallback(
    (tool: ActiveTool, subTool?: string) => {
      if (tool === 'select') {
        setActiveTool('select');
        setExpandedGroup(null);
        return;
      }

      const element = createDefaultElement(tool, subTool ?? null);
      if (element) {
        addElement(element);
        setActiveTool('select');
      } else {
        setActiveTool(tool, subTool);
      }
      setExpandedGroup(null);
    },
    [setActiveTool, addElement]
  );

  const groupIcons: Record<string, IconComponent> = {
    primitives: Box,
    connectors: Link2,
    presets: Package,
    annotations: Type,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="absolute top-1/3 left-3 z-20 flex -translate-y-1/3 flex-col gap-1 overflow-visible rounded-md p-1 shadow-2xl">
        {/* AI shortcut */}
        <ToolbarButton
          icon={Sparkles}
          label="AI Chat"
          shortcut="Ctrl+J"
          isActive={false}
          onClick={handleAiShortcut}
        />

        <ToolbarButton
          icon={Undo2}
          label="Undo"
          shortcut="Ctrl+Z"
          isActive={false}
          onClick={() => useSceneStore.temporal.getState().undo()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          isActive={false}
          onClick={() => useSceneStore.temporal.getState().redo()}
        />

        {toolGroups.map((group) => (
          <div key={group.id}>
            {group.expandable ? (
              <div className="relative">
                <ToolbarButton
                  icon={groupIcons[group.id] ?? group.buttons[0]?.icon ?? Box}
                  label={group.id.charAt(0).toUpperCase() + group.id.slice(1)}
                  isActive={expandedGroup === group.id}
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === group.id ? null : group.id
                    )
                  }
                />

                {expandedGroup === group.id && (
                  <Card className="absolute top-0 left-full z-20 ml-2 flex max-h-64 flex-col gap-0.5 overflow-auto rounded-lg p-1 shadow-xl">
                    {group.buttons.map((btn) => (
                      <ToolbarButton
                        key={btn.id}
                        icon={btn.icon}
                        label={btn.label}
                        shortcut={btn.shortcut}
                        isActive={
                          activeTool === btn.tool &&
                          activeSubTool === btn.subTool
                        }
                        onClick={() => handleToolClick(btn.tool!, btn.subTool)}
                        wide
                      />
                    ))}
                  </Card>
                )}
              </div>
            ) : (
              group.buttons.map((btn) => (
                <ToolbarButton
                  key={btn.id}
                  icon={btn.icon}
                  label={btn.label}
                  shortcut={btn.shortcut}
                  isActive={
                    activeTool === btn.tool && activeSubTool === btn.subTool
                  }
                  onClick={
                    btn.action ??
                    (() => handleToolClick(btn.tool!, btn.subTool))
                  }
                />
              ))
            )}
          </div>
        ))}

        {/* Scene toggles */}
        <ToolbarButton
          icon={Grid3X3}
          label={`Grid ${sceneSettings.gridVisible ? 'On' : 'Off'}`}
          shortcut="G"
          isActive={sceneSettings.gridVisible}
          onClick={() =>
            setSceneSettings({ gridVisible: !sceneSettings.gridVisible })
          }
        />

        {/* Delete */}
        <ToolbarButton
          icon={Trash2}
          label="Delete"
          shortcut="Del"
          isActive={false}
          disabled={!selectedId}
          onClick={() => {
            if (selectedId) removeElement(selectedId);
          }}
        />
      </Card>
    </TooltipProvider>
  );
}

interface ToolbarButtonProps {
  icon: IconComponent;
  label: string;
  shortcut?: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  wide?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  isActive,
  onClick,
  disabled,
  wide,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            isActive && 'bg-primary/10 text-primary',
            wide && 'min-w-30 justify-start px-3'
          )}
        >
          <Icon className="size-4 shrink-0" />
          {wide && <Label className="text-xs whitespace-nowrap">{label}</Label>}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        <Label>{label}</Label>
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}
