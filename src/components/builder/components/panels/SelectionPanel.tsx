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

const SelectionPanel: React.FC<Props> = (props) => <PropertyPanel {...props} mode="selection" />;
export default SelectionPanel;
