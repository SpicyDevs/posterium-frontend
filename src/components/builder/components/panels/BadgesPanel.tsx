import React, { memo } from 'react';
import type { PosterConfig } from '../../types';
import Inspector from '../layout/Inspector';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  hideChrome?: boolean;
}

const BadgesPanel: React.FC<Props> = memo(({ config, setConfig, hideChrome }) => (
  <Inspector config={config} setConfig={setConfig} forcedPanel="badges" hideTabBar={hideChrome} />
));

BadgesPanel.displayName = 'BadgesPanel';
export default BadgesPanel;
