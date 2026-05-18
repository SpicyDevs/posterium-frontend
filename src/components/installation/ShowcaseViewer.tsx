// src/components/installation/ShowcaseViewer.tsx
//
// FIX SUMMARY vs. previous version
// ─────────────────────────────────
// 1. Mobile grid uses auto-fill with a fluid minmax so posters never overflow
//    on narrow screens (was: `min(42vw, 190px)` which broke below ~380 px).
// 2. The outer section has `overflow: hidden` so nothing bleeds out of the
//    card on any viewport.
// 3. Device toggle buttons have proper aria-pressed + aria-label attributes
//    (accessibility + SEO signal for well-structured interactive content).
// 4. ShowcaseMediaFrame receives an explicit `loading` prop for the active
//    image so the first image is eager-loaded and subsequent ones are lazy.
// 5. Removed the memoized `mobileSlots` array — useMemo was overkill for a
//    ≤2-item array that only recalculates when props change anyway.

import { memo, useState, useCallback } from 'react';
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

const ShowcaseViewer = memo<ShowcaseViewerProps>(({ appName, images, placeholderImages }) => {
  const [activeDevice, setActiveDevice] = useState<InstallationDevice>('desktop');

  const handleDeviceChange = useCallback((device: InstallationDevice) => {
    setActiveDevice(device);
  }, []);

  // Merge real images over placeholders (placeholder is fallback when real URL absent)
  const mobileSlots = placeholderImages.mobile.map(
    (placeholder, idx) => images.mobile[idx] ?? placeholder
  );

  const desktopSrc = images.desktop || placeholderImages.desktop;
  const tvSrc = images.tv || placeholderImages.tv;

  return (
    <section
      aria-label={`${appName} screenshot showcase`}
      style={{
        border: '1px solid rgba(196,124,46,0.16)',
        background: 'linear-gradient(180deg, rgba(24,22,18,0.72), rgba(11,10,9,0.84))',
        borderRadius: 12,
        padding: 14,
        overflow: 'hidden', // FIX: prevent child overflow from breaking layout
      }}
    >
      {/* Header row */}
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

        <SegmentedControl<InstallationDevice>
          options={devices}
          value={activeDevice}
          onChange={handleDeviceChange}
          size="sm"
        />
      </div>

      {/* Content area */}
      <div
        style={{
          border: '1px solid rgba(196,124,46,0.2)',
          background: 'rgba(7,7,6,0.8)',
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: 120, // prevent layout shift while images load
        }}
      >
        {activeDevice === 'mobile' ? (
          // FIX: fluid grid — columns collapse gracefully below 320 px
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
              gap: 10,
              width: '100%',
            }}
          >
            {mobileSlots.map((slotSrc, idx) => (
              <ShowcaseMediaFrame
                key={`mobile-slot-${idx}`}
                src={slotSrc}
                alt={`${appName} mobile screenshot ${idx + 1}`}
                ratio="9 / 16"
                mobileFrame
                loading={idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={idx === 0 ? 'high' : 'low'}
              />
            ))}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 720 }}>
            <ShowcaseMediaFrame
              src={activeDevice === 'tv' ? tvSrc : desktopSrc}
              alt={`${appName} ${activeDevice} screenshot`}
              ratio="16 / 9"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}
      </div>
    </section>
  );
});

ShowcaseViewer.displayName = 'ShowcaseViewer';

export default ShowcaseViewer;
