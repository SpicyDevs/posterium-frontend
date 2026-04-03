import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DocsLayout, { type DocsSidebarLink } from '@/components/shared/DocsLayout';
import { AmberTag } from '@/components/shared/primitives';
import {
  installationApps,
  type InstallationAppConfig,
  type InstallationDevice,
} from '@/data/installation-config';

const devices: InstallationDevice[] = ['desktop', 'tv', 'mobile'];

const labelForDevice = (device: InstallationDevice): string => {
  if (device === 'tv') return 'TV';
  return device[0].toUpperCase() + device.slice(1);
};

const InstallationPage = memo(() => {
  const [search, setSearch] = useState('');
  const [selectedAppId, setSelectedAppId] = useState(installationApps[0]?.id ?? '');
  const [activeDeviceByApp, setActiveDeviceByApp] = useState<Record<string, InstallationDevice>>(
    () => Object.fromEntries(installationApps.map((app) => [app.id, 'desktop']))
  );

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return installationApps;
    return installationApps.filter((app) => app.name.toLowerCase().includes(q));
  }, [search]);

  const sidebarLinks = useMemo<DocsSidebarLink[]>(
    () =>
      filteredApps.map((app) => ({
        id: app.id,
        label: app.name,
        href: `#${app.id}`,
        active: app.id === (filteredApps.some((candidate) => candidate.id === selectedAppId)
          ? selectedAppId
          : filteredApps[0]?.id),
        onClick: () => setSelectedAppId(app.id),
      })),
    [filteredApps, selectedAppId]
  );

  const activeApp = useMemo(() => {
    if (!filteredApps.length) return null;
    return filteredApps.find((app) => app.id === selectedAppId) ?? filteredApps[0];
  }, [filteredApps, selectedAppId]);

  const setActiveDevice = (appId: string, device: InstallationDevice) => {
    setActiveDeviceByApp((prev) => ({
      ...prev,
      [appId]: device,
    }));
  };

  const renderShowcase = (app: InstallationAppConfig) => {
    const activeDevice = activeDeviceByApp[app.id] ?? 'desktop';
    const mobileImages = app.showcaseImages.mobile;
    const mobileSlots = [
      mobileImages[0] ?? '/placeholders/install-mobile.svg',
      mobileImages[1] ?? '/placeholders/install-mobile-alt.svg',
    ];
    const imageSrc = activeDevice === 'mobile' ? mobileSlots[0] : app.showcaseImages[activeDevice];

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
          <div style={{ display: 'inline-flex', gap: 6 }}>
            {devices.map((device) => {
              const active = activeDevice === device;
              return (
                <button
                  key={`${app.id}-${device}`}
                  type="button"
                  onClick={() => setActiveDevice(app.id, device)}
                  className="syne-font"
                  style={{
                    borderRadius: 6,
                    border: active
                      ? '1px solid rgba(212,162,69,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(196,124,46,0.24)' : 'rgba(255,255,255,0.03)',
                    color: active ? 'var(--film-cream)' : 'var(--film-text-label)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {labelForDevice(device)}
                </button>
              );
            })}
          </div>
        </div>

        {activeDevice === 'mobile' ? (
          <div
            style={{
              border: '1px solid rgba(196,124,46,0.2)',
              background: 'rgba(7,7,6,0.8)',
              borderRadius: 10,
              padding: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(42vw, 170px), 1fr))',
              gap: 10,
            }}
          >
            {mobileSlots.map((slotSrc, idx) => (
              <div
                key={`${app.id}-mobile-slot-${idx}`}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid rgba(212,162,69,0.2)',
                  overflow: 'hidden',
                  background: '#080807',
                }}
              >
                <img
                  src={slotSrc}
                  alt={`${app.name} mobile showcase ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    aspectRatio: '9 / 16',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                  }}
                  loading="lazy"
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
            <div
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid rgba(212,162,69,0.2)',
                aspectRatio: '16 / 9',
                overflow: 'hidden',
                background: '#080807',
              }}
            >
              <img
                src={imageSrc}
                alt={`${app.name} ${labelForDevice(activeDevice)} showcase`}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',
                }}
                loading="lazy"
              />
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <DocsLayout
      sidebarTitle="Apps"
      sidebarLinks={sidebarLinks}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: 'Search app guides…',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            className="poster-font"
            style={{
              margin: 0,
              fontSize: 'clamp(38px,7vw,64px)',
              letterSpacing: '0.08em',
              lineHeight: 0.9,
            }}
          >
            Installation
          </h1>
          <p
            className="body-font"
            style={{ margin: '10px 0 0', color: 'var(--film-text-dim)', fontSize: 14 }}
          >
            Setup Posterium in Plex, Emby, Jellyfin, Stremio, Kodi, and more.
          </p>
        </div>
        <AmberTag>{filteredApps.length} apps</AmberTag>
      </div>

      {activeApp ? (
        <article
          key={activeApp.id}
          id={activeApp.id}
          style={{
            scrollMarginTop: 88,
            border: '1px solid rgba(196,124,46,0.14)',
            background: 'rgba(14,13,11,0.72)',
            borderRadius: 12,
            padding: '14px 14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <h2
            className="syne-font"
            style={{
              margin: 0,
              fontSize: 15,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--film-pale)',
            }}
          >
            {activeApp.name}
          </h2>

          {renderShowcase(activeApp)}

          <section
            style={{
              border: '1px solid rgba(196,124,46,0.16)',
              background: 'rgba(10,10,9,0.66)',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <h3
              className="syne-font"
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--film-pale)',
              }}
            >
              Guide
            </h3>
            <div className="docs-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeApp.guideMarkdown}</ReactMarkdown>
            </div>
          </section>
        </article>
      ) : null}

      {!filteredApps.length ? (
        <div
          className="syne-font"
          style={{
            border: '1px solid rgba(196,124,46,0.14)',
            background: 'rgba(24,22,18,0.6)',
            borderRadius: 10,
            padding: 16,
            color: 'var(--film-text-dim)',
            fontSize: 13,
          }}
        >
          No app guides matched your search.
        </div>
      ) : null}
    </DocsLayout>
  );
});

InstallationPage.displayName = 'InstallationPage';

export default InstallationPage;
