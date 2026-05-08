import React from 'react';
import type { PosterConfig, RatingType } from '../../types';
import LayerPanel from '../LayerPanel';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  chrome?: boolean;
}

const SourcePanel: React.FC<Props> = ({ chrome = true, ...props }) => (
  <LayerPanel {...props} panelMode="source" hideTabs={!chrome} />
);

export default SourcePanel;
