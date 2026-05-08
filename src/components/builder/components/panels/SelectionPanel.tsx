import React, { memo } from 'react';
import type { PosterConfig } from '../../types';
import Inspector from '../layout/Inspector';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  hideChrome?: boolean;
}

const SelectionPanel: React.FC<Props> = memo(({ config, setConfig, hideChrome }) => (
  <Inspector config={config} setConfig={setConfig} forcedPanel="selection" hideTabBar={hideChrome} />
));

SelectionPanel.displayName = 'SelectionPanel';
export default SelectionPanel;
