import React from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition } from '../utils';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig }) => {
  
  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      pos: {
        ...prev.pos,
        [id]: { x, y }
      }
    }));
  };

  // Determine active badges and their order
  // For the purpose of "Auto Position", we need to know the index of the badge in the list
  const activeBadges = config.ratings;

  // Generate grid lines
  const renderGridLines = () => {
    const lines = [];
    // Vertical
    for (let i = 1; i < 4; i++) {
      lines.push(
        <div 
          key={`v-${i}`}
          className="absolute top-0 bottom-0 border-r border-white/10 pointer-events-none" 
          style={{ left: `${(i / 4) * 100}%` }}
        />
      );
    }
    // Horizontal
    for (let i = 1; i < 4; i++) {
      lines.push(
        <div 
          key={`h-${i}`}
          className="absolute left-0 right-0 border-b border-white/10 pointer-events-none" 
          style={{ top: `${(i / 4) * 100}%` }}
        />
      );
    }
    return lines;
  };

  const getPosterImage = () => {
      // Fallback or real TMDB image construction
      if(config.tmdbId) {
          // Note: In a real app we might fetch the config from TMDB to get the actual path.
          // For this editor, we use a placeholder if ID is missing, or a generic movie-like image.
          // Since we can't fetch TMDB without a key here, we'll use a reliable placeholder service 
          // that supports text or use the worker's own generated image as background (but that causes loop issues).
          // We will use a high quality placeholder from Lorem Picsum with a consistent seed based on ID.
          return `https://image.tmdb.org/t/p/w500/${config.tmdbId}.jpg`; // This usually 404s without a path.
      }
      return "https://picsum.photos/500/750";
  };
  
  // Use a proxy image for the preview background to simulate a movie poster
  // Interstellar: https://image.tmdb.org/t/p/w500/gEU2QniL6C8zYE1mWDk5DUE0qDb.jpg
  // We'll just hardcode a few for demo purposes if the ID matches defaults, otherwise generic.
  const bgImage = config.tmdbId === "157336" 
    ? "https://image.tmdb.org/t/p/w500/gEU2QniL6C8zYE1mWDk5DUE0qDb.jpg"
    : `https://picsum.photos/seed/${config.tmdbId}/500/750`;

  return (
    <div className="relative flex justify-center items-center p-4 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden">
      
      {/* Canvas Container */}
      <div 
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} 
        className="relative bg-black shadow-2xl overflow-hidden ring-1 ring-white/10"
      >
        {/* Background Image */}
        <img 
          src={bgImage} 
          alt="Poster Preview" 
          className="w-full h-full object-cover opacity-80"
          draggable={false}
        />

        {/* Grid Overlay (Visual Aid for snapping) */}
        {renderGridLines()}

        {/* Badges */}
        {activeBadges.map((id, index) => (
          <DraggableBadge
            key={id}
            id={id}
            config={config}
            onPositionChange={handlePositionChange}
            autoPos={calculateAutoPosition(id, index, activeBadges.length, config)}
          />
        ))}

        {/* Info Overlay */}
        <div className="absolute bottom-2 right-2 text-xs text-white/30 pointer-events-none font-mono">
           {CANVAS_WIDTH}x{CANVAS_HEIGHT}
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;
