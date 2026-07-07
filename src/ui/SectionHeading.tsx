import { memo } from 'react';

interface SectionHeadingProps {
  children: string;
  id?: string;
  level?: 2 | 3;
}

const SectionHeading = memo<SectionHeadingProps>(({ children, id, level = 2 }) => {
  const baseStyle: React.CSSProperties = {
    margin: level === 2 ? '0 0 10px' : '0 0 12px',
    fontSize: level === 2 ? 14 : 13,
    letterSpacing: level === 2 ? '0.12em' : '0.1em',
    textTransform: 'uppercase',
    color: 'var(--film-pale)',
  };

  const Tag = level === 2 ? 'h2' : 'h3';

  return (
    <Tag id={id} className="syne-font" style={{ ...baseStyle, scrollMarginTop: 88 }}>
      {children}
    </Tag>
  );
});

SectionHeading.displayName = 'SectionHeading';

export default SectionHeading;
