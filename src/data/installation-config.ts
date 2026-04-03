import plexGuide from '@/content/install/plex.md?raw';
import embyGuide from '@/content/install/emby.md?raw';
import jellyfinGuide from '@/content/install/jellyfin.md?raw';
import stremioGuide from '@/content/install/stremio.md?raw';
import kodiGuide from '@/content/install/kodi.md?raw';

export type InstallationDevice = 'desktop' | 'tv' | 'mobile';

export interface InstallationShowcaseImages {
  desktop: string;
  tv: string;
  mobile: string;
}

export interface InstallationAppConfig {
  id: string;
  name: string;
  showcaseImages: InstallationShowcaseImages;
  guideMarkdown: string;
}

const placeholderImages: InstallationShowcaseImages = {
  desktop: '/placeholders/install-desktop.svg',
  tv: '/placeholders/install-tv.svg',
  mobile: '/placeholders/install-mobile.svg',
};

export const installationApps: InstallationAppConfig[] = [
  {
    id: 'plex',
    name: 'Plex',
    showcaseImages: placeholderImages,
    guideMarkdown: plexGuide,
  },
  {
    id: 'emby',
    name: 'Emby',
    showcaseImages: placeholderImages,
    guideMarkdown: embyGuide,
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    showcaseImages: placeholderImages,
    guideMarkdown: jellyfinGuide,
  },
  {
    id: 'stremio',
    name: 'Stremio',
    showcaseImages: placeholderImages,
    guideMarkdown: stremioGuide,
  },
  {
    id: 'kodi',
    name: 'Kodi',
    showcaseImages: placeholderImages,
    guideMarkdown: kodiGuide,
  },
];
