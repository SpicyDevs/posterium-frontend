import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../../types';
import LayerPanel from '../LayerPanel';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  hideChrome?: boolean;
}

const PosterPanel: React.FC<Props> = memo((props) => (
  <LayerPanel {...props} forcedPanel="poster" hideTabBar={props.hideChrome} />
));

PosterPanel.displayName = 'PosterPanel';
export default PosterPanel;
