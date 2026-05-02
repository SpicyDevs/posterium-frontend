// src/components/dashboard/Nav.tsx
import { memo } from 'react';
import MainNavbar from '@/components/shared/MainNavbar';
import type { NavbarLink } from '@/components/shared/MainNavbar';

// Home-page section anchors + standard app links (handled by MainNavbar's APP_LINKS)
const NAV_LINKS: NavbarLink[] = [
  { label: 'Reel', href: '#reel' },
  { label: 'Features', href: '#combined' },
  { label: 'Integrations', href: '#integrations' },
];

const Nav = memo(() => (
  <MainNavbar
    revealOnScroll
    sectionLinks={NAV_LINKS}
    showMobileBuildCta
  />
));

Nav.displayName = 'Nav';
export default Nav;
