import { memo, useEffect, useMemo, useState } from 'react';
import TableOfContentsClient from '@/components/TableOfContentsClient';
import type { MarkdownHeading } from '@/lib/markdown-headings';

interface InstallationGuideMeta {
  id: string;
  label: string;
  href: string;
  headings: MarkdownHeading[];
}

interface InstallationSidebarClientProps {
  guides: InstallationGuideMeta[];
  initialGuideId: string;
}

const InstallationSidebarClient = memo<InstallationSidebarClientProps>(({ guides, initialGuideId }) => {
  const guideIds = useMemo(() => guides.map((guide) => guide.id), [guides]);
  const [activeGuideId, setActiveGuideId] = useState(initialGuideId);

  const activeGuide = useMemo(
    () => guides.find((guide) => guide.id === activeGuideId) ?? guides[0],
    [activeGuideId, guides]
  );

  useEffect(() => {
    const hashGuideId = window.location.hash.slice(1);
    if (hashGuideId && guideIds.includes(hashGuideId)) {
      setActiveGuideId(hashGuideId);
    }
  }, [guideIds]);

  useEffect(() => {
    const updateVisibleGuide = () => {
      const guideArticles = document.querySelectorAll<HTMLElement>('[data-guide-id]');
      guideArticles.forEach((article) => {
        const isActive = article.dataset.guideId === activeGuideId;
        article.classList.toggle('hidden', !isActive);
        article.classList.toggle('flex', isActive);
        article.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    };

    updateVisibleGuide();
  }, [activeGuideId]);

  useEffect(() => {
    const onHashChange = () => {
      const hashGuideId = window.location.hash.slice(1);
      if (hashGuideId && guideIds.includes(hashGuideId)) {
        setActiveGuideId(hashGuideId);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [guideIds]);

  const onGuideChange = (guideId: string) => {
    setActiveGuideId(guideId);
    window.history.pushState(null, '', `#${guideId}`);
  };

  if (!guides.length || !activeGuide) return null;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="syne-font mb-0.5 text-[11px] tracking-[0.12em] text-[var(--film-text-dim)] uppercase">
        Apps
      </div>

      <div className="md:hidden">
        <label htmlFor="installation-app-select" className="sr-only">
          Select installation app
        </label>
        <select
          id="installation-app-select"
          value={activeGuideId}
          onChange={(event) => onGuideChange(event.target.value)}
          className="syne-font w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs tracking-[0.06em] text-[var(--film-cream)] uppercase"
        >
          {guides.map((guide) => (
            <option key={`option-${guide.id}`} value={guide.id} className="bg-[var(--film-black)]">
              {guide.label}
            </option>
          ))}
        </select>
      </div>

      <nav id="app-nav" aria-label="Installation apps" className="hidden flex-col gap-1.5 md:flex">
        {guides.map((guide) => {
          const isActive = guide.id === activeGuideId;
          return (
            <a
              key={guide.id}
              href={guide.href}
              data-app-link={guide.id}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onGuideChange(guide.id);
              }}
              className={`syne-font rounded-md border px-2 py-1.5 text-xs tracking-[0.05em] uppercase transition-colors ${
                isActive
                  ? 'border-amber-300/50 bg-amber-800/35 text-[var(--film-cream)]'
                  : 'border-white/10 bg-white/[0.02] text-[var(--film-text-label)] hover:text-[var(--film-cream)]'
              }`}
            >
              {guide.label}
            </a>
          );
        })}
      </nav>

      <div id="toc-container" className="mt-1">
        <TableOfContentsClient headings={activeGuide.headings} activeGuideId={activeGuideId} />
      </div>
    </div>
  );
});

InstallationSidebarClient.displayName = 'InstallationSidebarClient';

export default InstallationSidebarClient;
