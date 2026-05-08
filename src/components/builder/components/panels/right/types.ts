import type React from 'react';
import type { PosterConfig } from '../../../types';

export interface BuilderRightPanelProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}
