// These are thin wrappers - the actual components are now in layer-panel/ and property-panel/
export { default as PropertyPanel } from '../PropertyPanel';
export { default as LayerPanel } from '../LayerPanel';

// For backwards compatibility with old API:
export const BadgesPanel = PropertyPanel;
export const SelectionPanel = PropertyPanel;
export const SourcePanel = LayerPanel;
export const LayersPanel = LayerPanel;
export const PosterPanel = LayerPanel;