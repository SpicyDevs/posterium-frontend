import React from 'react';

interface SnapGuidesProps {
  guide: {
    showVertical: boolean;
    showHorizontal: boolean;
    middleX: number;
    middleY: number;
  };
}

const SnapGuides: React.FC<SnapGuidesProps> = ({ guide }) => (
  <>
    {guide.showVertical && (
      <div
        className="absolute pointer-events-none z-30"
        style={{
          left: guide.middleX,
          top: 0,
          bottom: 0,
          width: 1,
          background: 'rgba(196,124,46,0.8)',
          transform: 'translateX(-50%)',
        }}
      />
    )}
    {guide.showHorizontal && (
      <div
        className="absolute pointer-events-none z-30"
        style={{
          top: guide.middleY,
          left: 0,
          right: 0,
          height: 1,
          background: 'rgba(196,124,46,0.8)',
          transform: 'translateY(-50%)',
        }}
      />
    )}
  </>
);

export default SnapGuides;