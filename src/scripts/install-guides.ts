interface GuideHeading {
  depth: number;
  slug: string;
  text: string;
  line: number;
}

interface GuideData {
  allGuideHeadings: { id: string; headings: GuideHeading[] }[];
  guideIds: string[];
}

(() => {
  'use strict';

  const dataEl = document.getElementById('install-guide-data');
  if (!dataEl?.textContent) return;

  let data: GuideData;
  try {
    data = JSON.parse(dataEl.textContent) as GuideData;
  } catch {
    return;
  }

  const { allGuideHeadings, guideIds } = data;

  /** Map guideId → serialised headings array */
  const headingsByGuide: Record<string, GuideHeading[]> = Object.fromEntries(
    allGuideHeadings.map(({ id, headings }) => [id, headings])
  );

  const appLinks = document.querySelectorAll<HTMLElement>('[data-app-link]');
  const guideEls = document.querySelectorAll<HTMLElement>('[data-guide-id]');

  /**
   * Switch the visible guide, update sidebar link styles, and fire the
   * "posterium:guide-change" CustomEvent so the React TOC island can
   * re-observe the correct headings.
   */
  function activateGuide(guideId: string) {
    // ── Sidebar link styles ──────────────────────────────────────────────
    appLinks.forEach((link) => {
      const isActive = link.dataset.appLink === guideId;
      link.setAttribute('aria-current', isActive ? 'page' : '');
    });

    // ── Article visibility ───────────────────────────────────────────────
    guideEls.forEach((el) => {
      if (el.dataset.guideId === guideId) {
        el.classList.add('install-guide--active');
      } else {
        el.classList.remove('install-guide--active');
      }
    });

    // ── Notify the React TOC island ──────────────────────────────────────
    const headings = headingsByGuide[guideId] ?? [];
    window.dispatchEvent(new CustomEvent('posterium:guide-change', { detail: { headings } }));

    // Update URL hash without triggering a scroll jump
    history.replaceState(null, '', `#${guideId}`);
  }

  // ── Wire up sidebar link clicks ────────────────────────────────────────
  appLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.appLink;
      if (id) activateGuide(id);
    });
  });

  // ── Handle initial hash (deep-link) ────────────────────────────────────
  const initialHash = window.location.hash.slice(1);
  if (initialHash && guideIds.includes(initialHash)) {
    activateGuide(initialHash);
  }

  // ── React to browser forward/back ──────────────────────────────────────
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && guideIds.includes(hash)) activateGuide(hash);
  });
})();

export {};
