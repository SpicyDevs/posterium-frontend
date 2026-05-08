import React from 'react';
import LayerPanel from '../../LayerPanel';
import type { BuilderLeftPanelProps } from './types';

const SourcePanel: React.FC<BuilderLeftPanelProps> = (props) => (
  <LayerPanel {...props} forcedPanel="source" />
);

export default SourcePanel;
