import React from 'react';
import type { PosterConfig, RatingType } from '../../types';
import PropertyPanel from '../PropertyPanel';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  selectedLogo?: boolean;
  selectedMinimalElements?: Set<string>;
}

const BadgesPanel: React.FC<Props> = (props) => <PropertyPanel {...props} mode="badges" />;
export default BadgesPanel;
