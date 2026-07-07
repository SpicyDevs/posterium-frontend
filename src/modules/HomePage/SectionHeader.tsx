import { memo } from 'react';
import type { ReactNode } from 'react';
import { AmberTag } from '@/modules/homepage/primitives';

interface SectionHeaderProps {
  tag: string;
  title: ReactNode;
  description?: ReactNode;
  rightContent?: ReactNode;
  padding?: string;
  marginBottom?: number;
}

export const SectionHeader = memo<SectionHeaderProps>(
  ({ tag, title, description, rightContent, padding, marginBottom = 32 }) => (
    <div style={{ padding: padding ?? 'clamp(48px,6vw,72px) clamp(20px,5vw,64px) 0' }}>
      <AmberTag style={{ marginBottom: 12 }}>{tag}</AmberTag>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          marginTop: 10,
          marginBottom,
        }}
      >
        <h2
          className="poster-font"
          style={{
            fontSize: 'clamp(36px,5.5vw,72px)',
            color: 'var(--film-cream)',
            lineHeight: 0.9,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </h2>
        {rightContent ??
          (description ? (
            <p
              className="syne-font"
              style={{
                fontSize: 11,
                color: 'var(--film-silver)',
                maxWidth: 380,
                lineHeight: 1.7,
                textAlign: 'right',
                paddingBottom: 6,
              }}
            >
              {description}
            </p>
          ) : null)}
      </div>
    </div>
  )
);

SectionHeader.displayName = 'SectionHeader';
