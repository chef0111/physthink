interface ToolButton {
  id: string;
  icon: IconComponent;
  label: string;
  shortcut?: string;
  tool?: ActiveTool;
  subTool?: string;
  action?: () => void;
}

interface ToolGroup {
  id: string;
  buttons: ToolButton[];
  expandable?: boolean;
}

type ActiveTool =
  | 'select'
  | 'add-primitive'
  | 'add-vector'
  | 'add-connector'
  | 'add-curve'
  | 'add-preset'
  | 'add-annotation';
