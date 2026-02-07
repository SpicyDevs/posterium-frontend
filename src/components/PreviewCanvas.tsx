import React, { useMemo } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition, DEFAULT_API_BASE } from '../utils';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig }) => {

  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      items: {
          ...prev.items,
          [id]: { ...prev.items[id], x, y }
      }
    }));
  };

  const renderGridLines = () => {
    const lines = [];
    for (let i = 1; i < 4; i++) {
      lines.push(
        <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-blue-400/20 pointer-events-none" style={{ left: `${(i / 4) * 100}%` }} />
      );
      lines.push(
        <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-blue-400/20 pointer-events-none" style={{ top: `${(i / 4) * 100}%` }} />
      );
    }
    return lines;
  };

  const cleanPosterUrl = useMemo(() => {
    return `${DEFAULT_API_BASE}/${config.tmdbId}.jpg`;
  }, [config.tmdbId]);

  return (
    <div className="relative flex justify-center items-center p-4 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border border-white/5">
      <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="relative bg-black shadow-2xl overflow-hidden ring-1 ring-white/10 group">

        {/* The Clean Poster */}
        <img
          src={cleanPosterUrl}
          alt="Poster Preview"
          className="w-full h-full object-cover opacity-100"
          draggable={false}
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {renderGridLines()}
        </div>

        {/* Badges Overlay */}
        {config.ratings.map((id, index) => {
          // 1. Calculate Auto Position based on current layout/preset
          const auto = calculateAutoPosition(id, index, config.ratings.length, config);
          
          // 2. Check if user has manually overridden this specific badge
          const itemConfig = config.items[id];
          const hasManualPos = itemConfig?.x !== undefined && itemConfig?.y !== undefined;

          // 3. Determine Final Position
          const finalX = hasManualPos ? itemConfig!.x! : auto.x;
          const finalY = hasManualPos ? itemConfig!.y! : auto.y;

          return (
            <DraggableBadge
              key={id}
              id={id}
              config={config}
              x={finalX}
              y={finalY}
              onPositionChange={handlePositionChange}
            />
          );
        })}

        <div className="absolute bottom-2 right-2 text-[10px] text-white/30 pointer-events-none font-mono">
          {CANVAS_WIDTH}x{CANVAS_HEIGHT}
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;