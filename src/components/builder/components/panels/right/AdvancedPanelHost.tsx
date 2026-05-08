import React from 'react';
import SourcePanel from '../left/SourcePanel';
import LayersPanel from '../left/LayersPanel';
import PosterPanel from '../left/PosterPanel';
import BadgesPanel from './BadgesPanel';
import SelectionPanel from './SelectionPanel';
import type { BuilderLeftPanelProps } from '../left/types';
import type { BuilderRightPanelProps } from './types';

type PanelId = 'source' | 'layers' | 'poster' | 'badges' | 'selection' | 'logo';

type Props = BuilderLeftPanelProps & BuilderRightPanelProps & { activePanel: PanelId };

const AdvancedPanelHost: React.FC<Props> = ({ activePanel, ...props }) => {
  if (activePanel === 'source') return <SourcePanel {...props} />;
  if (activePanel === 'layers') return <LayersPanel {...props} />;
  if (activePanel === 'poster') return <PosterPanel {...props} />;
  if (activePanel === 'badges') return <BadgesPanel {...props} />;
  return <SelectionPanel {...props} />;
};

export default AdvancedPanelHost;
