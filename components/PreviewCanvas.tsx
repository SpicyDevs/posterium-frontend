import React, { useMemo } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition } from '../utils';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const API_BASE = process.env.VITE_API_URL; // change if needed

const PreviewCanvas: React.FC<Props> = ({ config, setConfig }) => {

  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      pos: { ...prev.pos, [id]: { x, y } }
    }));
  };

  const activeBadges = config.ratings;

  const renderGridLines = () => {
    const lines = [];
    for (let i = 1; i < 4; i++) {
      lines.push(
        <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-white/10 pointer-events-none" style={{ left: `${(i / 4) * 100}%` }} />
      );
      lines.push(
        <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-white/10 pointer-events-none" style={{ top: `${(i / 4) * 100}%` }} />
      );
    }
    return lines;
  };

  /**
   * Convert config → worker query string
   */
  const buildQuery = () => {
    const p = new URLSearchParams();

    if (config.ratings.length) p.set("r", config.ratings.join(","));
    if (config.source) p.set("source", config.source);
    if (config.theme) p.set("t", config.theme);
    if (config.size) p.set("s", config.size);
    if (config.layout) p.set("l", config.layout);
    if (config.preset) p.set("pos", config.preset);
    if (config.shadow) p.set("sh", "1");
    if (config.customBg) p.set("bg", config.customBg);
    if (config.customTxt) p.set("txt", config.customTxt);

    const { imdb, rt, meta } = config.pos;
    if (!isNaN(imdb?.x)) p.set("ix", imdb.x.toString());
    if (!isNaN(imdb?.y)) p.set("iy", imdb.y.toString());
    if (!isNaN(rt?.x))   p.set("rx", rt.x.toString());
    if (!isNaN(rt?.y))   p.set("ry", rt.y.toString());
    if (!isNaN(meta?.x)) p.set("mx", meta.x.toString());
    if (!isNaN(meta?.y)) p.set("my", meta.y.toString());

    return p.toString();
  };

  /**
   * Final preview URL (memoized)
   */
  const bgImage = useMemo(() => {
    if (!config.tmdbId) return "";

    const query = buildQuery();

    // .jpg → forces worker raster conversion
    return `${API_BASE}/${config.tmdbId}?${query}`;
  }, [config]);

  return (
    <div className="relative flex justify-center items-center p-4 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden">
      <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="relative bg-black shadow-2xl overflow-hidden ring-1 ring-white/10">

        <img
          src={bgImage}
          alt="Poster Preview"
          className="w-full h-full object-cover opacity-90"
          draggable={false}
        />

        {renderGridLines()}

        {activeBadges.map((id, index) => (
          <DraggableBadge
            key={id}
            id={id}
            config={config}
            onPositionChange={handlePositionChange}
            autoPos={calculateAutoPosition(id, index, activeBadges.length, config)}
          />
        ))}

        <div className="absolute bottom-2 right-2 text-xs text-white/30 pointer-events-none font-mono">
          {CANVAS_WIDTH}x{CANVAS_HEIGHT}
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;
