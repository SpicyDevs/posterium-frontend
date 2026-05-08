import React from 'react';
import LayerPanel from '../../LayerPanel';
import type { BuilderLeftPanelProps } from './types';

const PosterPanel: React.FC<BuilderLeftPanelProps> = (props) => (
  <LayerPanel {...props} forcedPanel="poster" />
);

export default PosterPanel;
