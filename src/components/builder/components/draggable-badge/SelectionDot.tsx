import React from 'react';

interface SelectionDotProps {
  size: number;
  innerSize: number;
}

const SelectionDot: React.FC<SelectionDotProps> = ({ size, innerSize }) => (
  <div
    className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
    style={{
      top: `${-(size / 2)}px`,
      right: `${-(size / 2)}px`,
      width: `${size}px`,
      height: `${size}px`,
    }}
  >
    <div
      className="bg-white"
      style={{
        width: `${innerSize}px`,
        height: `${innerSize}px`,
        borderRadius: `${1.5}px`,
      }}
    />
  </div>
);

export default SelectionDot;