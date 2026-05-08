import React from 'react';
import Inspector from '../../layout/Inspector';
import type { BuilderRightPanelProps } from './types';

const BadgesPanel: React.FC<BuilderRightPanelProps> = (props) => (
  <Inspector {...props} mode="badges" hideTabBar />
);

export default BadgesPanel;
