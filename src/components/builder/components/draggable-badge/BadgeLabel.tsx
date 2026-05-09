import React from 'react';

interface BadgeLabelProps {
  position: string;
  text: string;
  size: number;
  color: string;
}

const BadgeLabel: React.FC<BadgeLabelProps> = ({ position, text, size, color }) => {
  const LABEL_GAP = 5;

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    fontSize: size,
    color,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    lineHeight: 1,
    textShadow: '0 1px 2px rgba(0,0,0,0.45)',
  };

  switch (position) {
    case 'above':
      return (
        <div
          style={{
            ...labelStyle,
            bottom: `calc(100% + ${LABEL_GAP}px)`,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          {text}
        </div>
      );
    case 'below':
      return (
        <div
          style={{
            ...labelStyle,
            top: `calc(100% + ${LABEL_GAP}px)`,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          {text}
        </div>
      );
    case 'left':
      return (
        <div
          style={{
            ...labelStyle,
            right: `calc(100% + ${LABEL_GAP}px)`,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {text}
        </div>
      );
    case 'right':
      return (
        <div
          style={{
            ...labelStyle,
            left: `calc(100% + ${LABEL_GAP}px)`,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {text}
        </div>
      );
    default:
      return null;
  }
};

export default BadgeLabel;