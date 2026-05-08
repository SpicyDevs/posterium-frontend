import React from 'react';
import Inspector from '../../layout/Inspector';
import type { BuilderRightPanelProps } from './types';

const SelectionPanel: React.FC<BuilderRightPanelProps> = (props) => (
  <Inspector {...props} mode="selection" hideTabBar />
);

export default SelectionPanel;
