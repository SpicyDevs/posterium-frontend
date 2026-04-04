import { memo, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DocsLayout, { type DocsSidebarLink } from '@/components/shared/DocsLayout';
import { AmberTag } from '@/components/shared/primitives';
import ShowcaseMediaFrame from '@/components/installation/ShowcaseMediaFrame';
import TableOfContentsClient from '@/components/TableOfContentsClient';
import {
  installationApps,
  installationPlaceholderImages,
  type InstallationAppConfig,
  type InstallationDevice,
} from '@/data/installation-config';
import { extractMarkdownHeadings, type MarkdownHeading } from '@/lib/markdown-headings';

const devices: InstallationDevice[] = ['desktop', 'tv', 'mobile'];
const MOBILE_SHOWCASE_WIDTH = 'min(42vw, 190px)';
const MOBILE_SHOWCASE_RATIO = '9 / 16' as const;
const STICKY_HEADER_OFFSET_PX = 88;
const TOC_OBSERVER_BOTTOM_MARGIN = '-58%';

const labelForDevice = (device: InstallationDevice): string => {
  if (device === 'tv') return 'TV';
  return device[0].toUpperCase() + device.slice(1);
};

const getMobileShowcaseSlots = (mobileImages: string[]): string[] => {
  return installationPlaceholderImages.mobile.map((placeholder, idx) => mobileImages[idx] ?? placeholder);
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

  const selectedVisibleAppId = useMemo(() => {
    if (!filteredApps.length) return '';
    return filteredApps.some((app) => app.id === selectedAppId) ? selectedAppId : filteredApps[0].id;
  }, [filteredApps, selectedAppId]);

  const sidebarLinks = useMemo<DocsSidebarLink[]>(
    () =>
      filteredApps.map((app) => ({
        id: app.id,
        label: app.name,
        href: `#${app.id}`,
        active: app.id === selectedVisibleAppId,
        onClick: () => setSelectedAppId(app.id),
      })),
    [filteredApps, selectedVisibleAppId]
  );

  const activeApp = useMemo(() => {
    if (!filteredApps.length) return null;
    return filteredApps.find((app) => app.id === selectedVisibleAppId) ?? filteredApps[0];
  }, [filteredApps, selectedVisibleAppId]);

  const guideHeadings = useMemo<MarkdownHeading[]>(() => {
    if (!activeApp) return [];
    return extractMarkdownHeadings(activeApp.guideMarkdown);
  }, [activeApp]);

  const h2SlugByLine = useMemo(
    () =>
      new Map(
        guideHeadings
          .filter((heading) => heading.depth === 2)
          .map((heading) => [heading.line, heading.slug] as const)
      ),
    [guideHeadings]
  );
  const h3SlugByLine = useMemo(
    () =>
      new Map(
        guideHeadings
          .filter((heading) => heading.depth === 3)
          .map((heading) => [heading.line, heading.slug] as const)
      ),
    [guideHeadings]
  );

  useEffect(() => {
    if (!guideHeadings.length) return;

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'));
    const headings = guideHeadings
      .map((heading) => document.getElementById(heading.slug))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!links.length || !headings.length) return;

    const setActive = (slug: string) => {
      links.forEach((link) => {
        if (link.dataset.tocLink === slug) link.setAttribute('data-active', 'true');
        else link.removeAttribute('data-active');
      });
    };

    const firstSlug = headings[0]?.id;
    if (firstSlug) setActive(firstSlug);

    const clickHandlers: Array<() => void> = [];
    links.forEach((link) => {
      const handler = (event: Event) => {
        event.preventDefault();
        const slug = link.dataset.tocLink;
        if (!slug) return;
        const target = document.getElementById(slug);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActive(slug);
      };
      link.addEventListener('click', handler);
      clickHandlers.push(() => link.removeEventListener('click', handler));
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const current = visible[0].target as HTMLElement;
        if (current.id) setActive(current.id);
      },
      {
        rootMargin: `-${STICKY_HEADER_OFFSET_PX}px 0px ${TOC_OBSERVER_BOTTOM_MARGIN} 0px`,
        threshold: [0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => {
      observer.disconnect();
      clickHandlers.forEach((dispose) => dispose());
    };
  }, [guideHeadings, activeApp?.id]);

  const setActiveDevice = (appId: string, device: InstallationDevice) => {
    setActiveDeviceByApp((prev) => ({
      ...prev,
      [appId]: device,
    }));
  };

  const renderShowcase = (app: InstallationAppConfig) => {
    const activeDevice = activeDeviceByApp[app.id] ?? 'desktop';
    const mobileImages = app.showcaseImages.mobile;
    const mobileSlots = getMobileShowcaseSlots(mobileImages);
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
              gridTemplateColumns: `repeat(auto-fit, minmax(${MOBILE_SHOWCASE_WIDTH}, 1fr))`,
              gap: 10,
            }}
          >
            {mobileSlots.map((slotSrc, idx) => (
              <div
                key={`${app.id}-mobile-slot-${idx}`}
                style={{
                  width: '100%',
                }}
              >
                <ShowcaseMediaFrame
                  src={slotSrc}
                  alt={`${app.name} mobile showcase ${idx + 1}`}
                  ratio={MOBILE_SHOWCASE_RATIO}
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
              src={imageSrc}
              alt={`${app.name} ${labelForDevice(activeDevice)} showcase`}
              ratio="16 / 9"
            />
          </div>
        )}
      </section>
    );
  };

  return (
    <DocsLayout
      sidebarTitle="Apps"
      sidebarLinks={sidebarLinks}
      sidebarFooter={<TableOfContentsClient headings={guideHeadings} />}
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
            scrollMarginTop: STICKY_HEADER_OFFSET_PX,
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: (props) => {
                    const line = Number(props.node?.position?.start?.line);
                    const slug = h2SlugByLine.get(line);
                    return (
                      <h2 id={slug} style={{ scrollMarginTop: STICKY_HEADER_OFFSET_PX }}>
                        {props.children}
                      </h2>
                    );
                  },
                  h3: (props) => {
                    const line = Number(props.node?.position?.start?.line);
                    const slug = h3SlugByLine.get(line);
                    return (
                      <h3 id={slug} style={{ scrollMarginTop: STICKY_HEADER_OFFSET_PX }}>
                        {props.children}
                      </h3>
                    );
                  },
                }}
              >
                {activeApp.guideMarkdown}
              </ReactMarkdown>
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
