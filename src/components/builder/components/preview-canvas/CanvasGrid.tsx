import React from 'react';

const CanvasGrid: React.FC = () => (
  <div className="absolute inset-0 z-30 pointer-events-none opacity-20">
    <div className="absolute top-0 bottom-0 left-1/3 border-l border-white" />
    <div className="absolute top-0 bottom-0 left-2/3 border-l border-white" />
    <div className="absolute left-0 right-0 top-1/3 border-t border-white" />
    <div className="absolute left-0 right-0 top-2/3 border-t border-white" />
  </div>
);

export default CanvasGrid;