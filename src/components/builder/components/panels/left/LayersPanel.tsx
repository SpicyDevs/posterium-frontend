import React from 'react';
import LayerPanel from '../../LayerPanel';
import type { BuilderLeftPanelProps } from './types';

const LayersPanel: React.FC<BuilderLeftPanelProps> = (props) => (
  <LayerPanel {...props} forcedPanel="layers" />
);

export default LayersPanel;
