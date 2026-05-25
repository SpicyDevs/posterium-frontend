import React, { memo, useRef, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import PreviewCanvas from '../PreviewCanvas';
import ExportPopover from '../ExportPopover';
import type { ExtensionType, PosterConfig, RatingType } from '../../types';
import { generateApiUrl } from '../../utils';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
}

const RevealAndExport: React.FC<Props> = memo(
  ({ config, setConfig, selectedIds, onSelect, baseUrl, handleLoadConfig }) => {
    const [exportOpen, setExportOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const exportBtnRef = useRef<HTMLButtonElement>(null);

    const setExtension = (ext: ExtensionType) => setConfig((prev) => ({ ...prev, extension: ext }));

    const copyApiUrl = async () => {
      const url = generateApiUrl(config, baseUrl);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    };

    return (
      <section
        className="relative mx-auto max-w-6xl rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(196,124,46,0.15)' }}
      >
        <div className="h-[70dvh] bg-[#111113]">
          <PreviewCanvas
            config={config}
            setConfig={setConfig}
            selectedIds={selectedIds}
            onSelect={onSelect}
          />
        </div>

        <div
          className="absolute left-4 right-4 bottom-4 rounded-xl border p-3 sm:p-4 backdrop-blur-xl"
          style={{
            borderColor: 'rgba(255,255,255,0.22)',
            background: 'rgba(15,15,15,0.58)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {(['png', 'jpg', 'webp', 'svg'] as ExtensionType[]).map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => setExtension(ext)}
                className="h-8 px-3 rounded-md text-[10px] syne-font uppercase tracking-wider border"
                style={{
                  borderColor: config.extension === ext ? 'var(--film-amber)' : 'rgba(255,255,255,0.2)',
                  color: config.extension === ext ? 'var(--film-amber)' : 'var(--film-cream)',
                }}
              >
                {ext}
              </button>
            ))}

            <button
              ref={exportBtnRef}
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[10px] syne-font font-bold uppercase tracking-wider"
              style={{ background: 'var(--film-amber)', color: '#070706' }}
            >
              <Download size={12} />
              Download
            </button>

            <button
              type="button"
              onClick={copyApiUrl}
              className="h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[10px] syne-font uppercase tracking-wider border"
              style={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: copied ? 'var(--film-amber)' : 'var(--film-cream)',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy API URL'}
            </button>
          </div>

          <ExportPopover
            config={config}
            onLoadConfig={handleLoadConfig}
            baseUrl={baseUrl}
            onExtensionChange={setExtension}
            isOpen={exportOpen}
            onClose={() => setExportOpen(false)}
            anchorRef={exportBtnRef}
          />
        </div>
      </section>
    );
  }
);

RevealAndExport.displayName = 'RevealAndExport';
export default RevealAndExport;
