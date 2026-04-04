import { memo, type ReactNode } from 'react';
import { AmberTag } from '@/components/shared/primitives';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  badgeSuffix?: string;
  actions?: ReactNode;
}

const PageHeader = memo<PageHeaderProps>(({ title, subtitle, badge, badgeSuffix, actions }) => {
  return (
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
          {title}
        </h1>
        {subtitle ? (
          <p
            className="body-font"
            style={{ margin: '10px 0 0', color: 'var(--film-text-dim)', fontSize: 14 }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {badge !== undefined ? (
          <AmberTag>
            {badge}
            {badgeSuffix ? ` ${badgeSuffix}` : ''}
          </AmberTag>
        ) : null}
        {actions}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
