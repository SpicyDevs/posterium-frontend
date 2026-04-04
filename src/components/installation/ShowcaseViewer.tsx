import { memo, useState, useMemo } from 'react';
import ShowcaseMediaFrame from './ShowcaseMediaFrame';
import SegmentedControl from '@/components/ui/SegmentedControl';

export type InstallationDevice = 'desktop' | 'tv' | 'mobile';

export interface ShowcaseImages {
  desktop: string;
  tv: string;
  mobile: string[];
}

interface ShowcaseViewerProps {
  appName: string;
  images: ShowcaseImages;
  placeholderImages: ShowcaseImages;
}

const devices: { value: InstallationDevice; label: string }[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tv', label: 'TV' },
  { value: 'mobile', label: 'Mobile' },
];

const MOBILE_SHOWCASE_WIDTH = 'min(42vw, 190px)';

const ShowcaseViewer = memo<ShowcaseViewerProps>(({ appName, images, placeholderImages }) => {
  const [activeDevice, setActiveDevice] = useState<InstallationDevice>('desktop');

  const mobileSlots = useMemo(() => {
    return placeholderImages.mobile.map((placeholder, idx) => images.mobile[idx] ?? placeholder);
  }, [images.mobile, placeholderImages.mobile]);

  return (
    <section
      style={{
        border: '1px solid rgba(196,124,46,0.16)',
        background: 'linear-gradient(180deg, rgba(24,22,18,0.72), rgba(11,10,9,0.84))',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <h3
          className="syne-font"
          style={{
            margin: 0,
            fontSize: 13,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--film-pale)',
          }}
        >
          Showcase
        </h3>
        <SegmentedControl
          options={devices}
          value={activeDevice}
          onChange={setActiveDevice}
          size="sm"
        />
      </div>

      {activeDevice === 'mobile' ? (
        <div
          style={{
            border: '1px solid rgba(196,124,46,0.2)',
            background: 'rgba(7,7,6,0.8)',
            borderRadius: 10,
            padding: 12,
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${MOBILE_SHOWCASE_WIDTH}, 1fr))`,
            gap: 10,
          }}
        >
          {mobileSlots.map((slotSrc, idx) => (
            <div key={`mobile-slot-${idx}`} style={{ width: '100%' }}>
              <ShowcaseMediaFrame
                src={slotSrc}
                alt={`${appName} mobile showcase ${idx + 1}`}
                ratio="9 / 16"
                mobileFrame
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            border: '1px solid rgba(196,124,46,0.2)',
            background: 'rgba(7,7,6,0.8)',
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ShowcaseMediaFrame
            src={activeDevice === 'tv' ? images.tv : images.desktop}
            alt={`${appName} ${activeDevice} showcase`}
            ratio="16 / 9"
          />
        </div>
      )}
    </section>
  );
});

ShowcaseViewer.displayName = 'ShowcaseViewer';

export default ShowcaseViewer;
