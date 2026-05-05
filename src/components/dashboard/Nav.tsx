import { memo } from 'react';
import MainNavbar from '../shared/MainNavbar';

const Nav = memo(() => {
  return (
    <MainNavbar
      revealOnScroll={true}
      sectionLinks={[
        { label: 'Reel', href: '#reel' },
        { label: 'Features', href: '#combined' },
        { label: 'Integrations', href: '#integrations' },
      ]}
    />
  );
});

Nav.displayName = 'Nav';
export default Nav;
