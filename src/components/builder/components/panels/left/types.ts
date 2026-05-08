import type React from 'react';
import type { PosterConfig, RatingType } from '../../../types';

export interface BuilderLeftPanelProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}
