import plexGuide from '@/content/install/plex.md?raw';
import embyGuide from '@/content/install/emby.md?raw';
import jellyfinGuide from '@/content/install/jellyfin.md?raw';
import stremioGuide from '@/content/install/stremio.md?raw';
import kodiGuide from '@/content/install/kodi.md?raw';

export type InstallationDevice = 'desktop' | 'tv' | 'mobile';

export interface InstallationShowcaseImages {
  desktop: string;
  tv: string;
  mobile: string[];
}

export interface InstallationAppConfig {
  id: string;
  name: string;
  showcaseImages: InstallationShowcaseImages;
  guideMarkdown: string;
}

export const installationPlaceholderImages: InstallationShowcaseImages = {
  desktop: '/placeholders/install-desktop.svg',
  tv: '/placeholders/install-tv.svg',
  mobile: ['/placeholders/install-mobile.svg', '/placeholders/install-mobile-alt.svg'],
};

export const installationApps: InstallationAppConfig[] = [
  {
    id: 'plex',
    name: 'Plex',
    showcaseImages: installationPlaceholderImages,
    guideMarkdown: plexGuide,
  },
  {
    id: 'emby',
    name: 'Emby',
    showcaseImages: installationPlaceholderImages,
    guideMarkdown: embyGuide,
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    showcaseImages: installationPlaceholderImages,
    guideMarkdown: jellyfinGuide,
  },
  {
    id: 'stremio',
    name: 'Stremio',
    showcaseImages: installationPlaceholderImages,
    guideMarkdown: stremioGuide,
  },
  {
    id: 'kodi',
    name: 'Kodi',
    showcaseImages: installationPlaceholderImages,
    guideMarkdown: kodiGuide,
  },
];
