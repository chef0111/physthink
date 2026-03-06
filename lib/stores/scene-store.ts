import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';

// Element Types
export type Vec3 = [number, number, number];

export interface BaseMaterial {
  color?: string;
  opacity?: number;
  wireframe?: boolean;
  metalness?: number;
  roughness?: number;
}

interface BaseElement {
  id: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  label?: string;
  visible?: boolean;
}

export interface MeshElement extends BaseElement {
  type: 'mesh';
  geometry:
    | 'box'
    | 'sphere'
    | 'cylinder'
    | 'cone'
    | 'capsule'
    | 'torus'
    | 'plane';
  material?: BaseMaterial;
  geometryArgs?: number[];
}

export interface VectorElement extends BaseElement {
  type: 'vector';
  from: Vec3;
  to: Vec3;
  color?: string;
  headSize?: number;
  dashed?: boolean;
}

export interface ConnectorElement extends BaseElement {
  type: 'connector';
  connector: 'spring' | 'rope' | 'rod' | 'wire';
  start: Vec3;
  end: Vec3;
  startId?: string;
  endId?: string;
  coils?: number;
  segments?: number;
  thickness?: number;
  color?: string;
}

export interface CurveElement extends BaseElement {
  type: 'curve';
  points: Vec3[];
  closed?: boolean;
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
}

export interface PresetElement extends BaseElement {
  type: 'preset';
  presetId: string;
  params?: Record<string, unknown>;
}

export type AnnotationKind =
  | 'label'
  | 'angle-marker'
  | 'dimension'
  | 'coordinate-axes'
  | 'region';

export interface AnnotationElement extends BaseElement {
  type: 'annotation';
  annotationKind: AnnotationKind;
  text?: string;
  color?: string;
  fontSize?: number;
  // angle-marker
  vectors?: [Vec3, Vec3];
  // dimension
  start?: Vec3;
  end?: Vec3;
}

export interface LightElement extends BaseElement {
  type: 'light';
  lightType: 'ambient' | 'directional' | 'point' | 'spot';
  color?: string;
  intensity?: number;
}

export interface GroupElement extends BaseElement {
  type: 'group';
  children: SceneElement[];
}

export interface CustomElement extends BaseElement {
  type: 'custom';
  code: string;
}

export type SceneElement =
  | MeshElement
  | VectorElement
  | ConnectorElement
  | CurveElement
  | PresetElement
  | AnnotationElement
  | LightElement
  | GroupElement
  | CustomElement;

// Scene Settings
export interface SceneSettings {
  gridVisible: boolean;
  axesVisible: boolean;
  backgroundColor: string;
}

// Tool State
export type ActiveTool =
  | 'select'
  | 'add-primitive'
  | 'add-vector'
  | 'add-connector'
  | 'add-curve'
  | 'add-preset'
  | 'add-annotation';

// Size Limits (Cross-cutting Concern B)
const ELEMENT_SOFT_LIMIT = 100;
const ELEMENT_HARD_LIMIT = 500;

// Store
export interface SceneState {
  elements: SceneElement[];
  selectedId: string | null;
  sceneSettings: SceneSettings;
  activeTool: ActiveTool;
  activeSubTool: string | null;

  addElement: (element: SceneElement) => boolean;
  updateElement: (id: string, updates: Partial<SceneElement>) => void;
  removeElement: (id: string) => void;
  setSelected: (id: string | null) => void;
  setSceneSettings: (settings: Partial<SceneSettings>) => void;
  setActiveTool: (tool: ActiveTool, subTool?: string | null) => void;
  loadScene: (data: unknown) => void;
  getElementCount: () => number;
}

function countElements(elements: SceneElement[]): number {
  let count = 0;
  for (const el of elements) {
    count++;
    if (el.type === 'group' && el.children) {
      count += countElements(el.children);
    }
  }
  return count;
}

function removeById(elements: SceneElement[], id: string): SceneElement[] {
  return elements
    .filter((el) => el.id !== id)
    .map((el) => {
      if (el.type === 'group' && el.children) {
        return { ...el, children: removeById(el.children, id) };
      }
      return el;
    });
}

function updateById(
  elements: SceneElement[],
  id: string,
  updates: Partial<SceneElement>
): SceneElement[] {
  return elements.map((el) => {
    if (el.id === id) {
      return { ...el, ...updates } as SceneElement;
    }
    if (el.type === 'group' && el.children) {
      return { ...el, children: updateById(el.children, id, updates) };
    }
    return el;
  });
}

const DEFAULT_SETTINGS: SceneSettings = {
  gridVisible: true,
  axesVisible: true,
  backgroundColor: '#1a1a2e',
};

export const useSceneStore = create<SceneState>()(
  temporal(
    subscribeWithSelector((set, get) => ({
      elements: [],
      selectedId: null,
      sceneSettings: { ...DEFAULT_SETTINGS },
      activeTool: 'select',
      activeSubTool: null,

      addElement: (element) => {
        const count = get().getElementCount();
        if (count >= ELEMENT_HARD_LIMIT) {
          console.warn(
            `Scene element hard limit (${ELEMENT_HARD_LIMIT}) reached. Cannot add more elements.`
          );
          return false;
        }
        set((state) => ({ elements: [...state.elements, element] }));
        if (count + 1 >= ELEMENT_SOFT_LIMIT) {
          console.warn(
            `Scene has ${count + 1} elements. Performance may degrade.`
          );
        }
        return true;
      },

      updateElement: (id, updates) => {
        set((state) => ({
          elements: updateById(state.elements, id, updates),
        }));
      },

      removeElement: (id) => {
        set((state) => ({
          elements: removeById(state.elements, id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },

      setSelected: (id) => set({ selectedId: id }),

      setSceneSettings: (settings) =>
        set((state) => ({
          sceneSettings: { ...state.sceneSettings, ...settings },
        })),

      setActiveTool: (tool, subTool = null) =>
        set({ activeTool: tool, activeSubTool: subTool }),

      loadScene: (data) => {
        if (!data || typeof data !== 'object') {
          set({ elements: [], sceneSettings: { ...DEFAULT_SETTINGS } });
          return;
        }
        const scene = data as {
          elements?: SceneElement[];
          sceneSettings?: Partial<SceneSettings>;
        };
        set({
          elements: Array.isArray(scene.elements) ? scene.elements : [],
          sceneSettings: {
            ...DEFAULT_SETTINGS,
            ...(scene.sceneSettings ?? {}),
          },
          selectedId: null,
        });
      },

      getElementCount: () => countElements(get().elements),
    })),
    {
      partialize: (state) => ({
        elements: state.elements,
        sceneSettings: state.sceneSettings,
      }),
      equality: (pastState, currentState) =>
        JSON.stringify(pastState) === JSON.stringify(currentState),
      limit: 50,
    }
  )
);
