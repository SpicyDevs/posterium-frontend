import React from 'react';
import LayerPanel from '../../components/LayerPanel';
import type { PosterConfig, RatingType } from '../../types';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  side?: 'left' | 'right' | 'none';
}

const SourcePanel: React.FC<Props> = (props) => (
  <LayerPanel {...props} mode="source" hideTabBar side={props.side ?? 'none'} />
);

export default SourcePanel;
