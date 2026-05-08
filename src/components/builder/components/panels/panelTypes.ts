import type { LucideIcon } from 'lucide-react';
import { Film, Layers, Monitor, MousePointer2, Sliders } from 'lucide-react';

export type BuilderMode = 'simple' | 'advanced';
export type BuilderPanelId = 'source' | 'layers' | 'poster' | 'badges' | 'selection';

export const BUILDER_PANELS: ReadonlyArray<{
  id: BuilderPanelId;
  label: string;
  description: string;
  Icon: LucideIcon;
  group: 'left' | 'right';
}> = [
  { id: 'source', label: 'Source', description: 'Media, API keys, and poster source', Icon: Film, group: 'left' },
  { id: 'layers', label: 'Layers', description: 'Badge order, visibility, and logo', Icon: Layers, group: 'left' },
  { id: 'poster', label: 'Poster', description: 'Canvas overlays and poster effects', Icon: Monitor, group: 'left' },
  { id: 'badges', label: 'Badges', description: 'Global badge and logo styling', Icon: Sliders, group: 'right' },
  { id: 'selection', label: 'Selection', description: 'Selected layer properties', Icon: MousePointer2, group: 'right' },
] as const;

export const SIMPLE_LEFT_PANEL_IDS = ['source', 'layers', 'poster'] as const;
export const SIMPLE_RIGHT_PANEL_IDS = ['badges', 'selection'] as const;

export const getPanelMeta = (panelId: BuilderPanelId) =>
  BUILDER_PANELS.find((panel) => panel.id === panelId) ?? BUILDER_PANELS[0];

export const isBuilderPanelId = (value: string): value is BuilderPanelId =>
  BUILDER_PANELS.some((panel) => panel.id === value);
