import { memo } from 'react';
import MainNavbar from '@/components/shared/MainNavbar';

const NAV_LINKS = [
  { label: 'Reel', href: '#reel' },
  { label: 'Features', href: '#combined' },
  { label: 'Integrations', href: '#integrations' },
] as const;

const Nav = memo(() => (
  <MainNavbar
    sectionLinks={[...NAV_LINKS]}
    revealOnScroll
    search={{
      value: '',
      onChange: () => {},
      placeholder: 'Search FAQs or examples…',
      readOnly: true,
    }}
  />
));

Nav.displayName = 'Nav';

export default Nav;
