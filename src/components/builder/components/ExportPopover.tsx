import { memo } from 'react';
import type { ExtensionType, PosterConfig } from '../types';
import ExportMenu from '@/components/shared/ExportMenu';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
  onExtensionChange: (ext: ExtensionType) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  panelId?: string;
}

const ExportPopover = memo<Props>(
  ({ config, onLoadConfig, baseUrl, onExtensionChange, isOpen, onClose, anchorRef, panelId }) => (
    <ExportMenu
      config={config}
      onLoadConfig={onLoadConfig}
      baseUrl={baseUrl}
      onExtensionChange={onExtensionChange}
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      panelId={panelId}
    />
  )
);

ExportPopover.displayName = 'ExportPopover';

export default ExportPopover;
