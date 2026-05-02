// src/components/builder/components/LayerPanelSimple.tsx
import React, { useState } from 'react';
import { Layers, Search } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import type { PosterConfig, RatingType } from '../types';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

type Tab = 'source' | 'layers';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'source', label: 'Source' },
  { id: 'layers', label: 'Layers' },
];

/**
 * Simplified left sidebar for Simple mode.
 * Source tab: media search, source selector, textless, blur, grayscale.
 * Layers tab: mirrors the existing layer list from LayerPanel.
 */
export const LayerPanelSimple: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const [activeTab, setActiveTab] = useState<Tab>('source');
  const { setBuilderMode } = useEditor();

  const LABEL_STYLE: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--film-text-dim)',
    fontFamily: 'Syne, sans-serif',
    display: 'block',
    marginBottom: 6,
  };

  const INPUT_STYLE: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--film-cream)',
    fontSize: 12,
    padding: '7px 10px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const ROW_STYLE: React.CSSProperties = {
    marginBottom: 16,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--film-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Left panel tabs"
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(196,124,46,0.07)',
          flexShrink: 0,
        }}
      >
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              minHeight: 40,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === id ? '2px solid var(--film-amber)' : '2px solid transparent',
              color: activeTab === id ? 'var(--film-amber)' : 'var(--film-text-dim)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              transition: 'color var(--transition-fast)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        role="tabpanel"
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}
      >
        {activeTab === 'source' && (
          <div>
            {/* IMDB / TMDB ID search */}
            <div style={ROW_STYLE}>
              <label style={LABEL_STYLE}>Search or ID</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 10,
                    color: 'var(--film-text-ghost)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Title or IMDb ID…"
                  defaultValue={config.imdbId || config.tmdbId}
                  style={{ ...INPUT_STYLE, paddingLeft: 30 }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (!v) return;
                    if (v.startsWith('tt')) setConfig((p) => ({ ...p, imdbId: v, tmdbId: '' }));
                    else setConfig((p) => ({ ...p, tmdbId: v, imdbId: undefined }));
                  }}
                />
              </div>
            </div>

            {/* Media type */}
            <div style={ROW_STYLE}>
              <label style={LABEL_STYLE}>Media Type</label>
              <select
                value={config.mediaType}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mediaType: e.target.value as PosterConfig['mediaType'] }))
                }
                style={{ ...INPUT_STYLE, cursor: 'pointer' }}
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            {/* Poster source */}
            <div style={ROW_STYLE}>
              <label style={LABEL_STYLE}>Poster Source</label>
              <select
                value={config.source}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    source: e.target.value as PosterConfig['source'],
                  }))
                }
                style={{ ...INPUT_STYLE, cursor: 'pointer' }}
              >
                <option value="tmdb">TMDB</option>
                <option value="fanart">Fanart.tv</option>
                <option value="metahub">MetaHub</option>
                <option value="mal">MyAnimeList</option>
                <option value="anilist">AniList</option>
              </select>
            </div>

            {/* Textless toggle */}
            <div style={{ ...ROW_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Textless Poster</label>
              <button
                role="switch"
                aria-checked={config.textless}
                onClick={() => setConfig((p) => ({ ...p, textless: !p.textless }))}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: config.textless ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background var(--transition-fast)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: config.textless ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left var(--transition-spring)',
                  }}
                />
              </button>
            </div>

            {/* Grayscale toggle */}
            <div style={{ ...ROW_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Grayscale</label>
              <button
                role="switch"
                aria-checked={config.grayscale}
                onClick={() => setConfig((p) => ({ ...p, grayscale: !p.grayscale }))}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: config.grayscale ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background var(--transition-fast)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: config.grayscale ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left var(--transition-spring)',
                  }}
                />
              </button>
            </div>

            {/* Blur slider */}
            <div style={ROW_STYLE}>
              <label style={LABEL_STYLE}>
                Blur
                <span style={{ marginLeft: 6, color: 'var(--film-amber)', fontVariantNumeric: 'tabular-nums' }}>
                  {config.posterBlur}px
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={config.posterBlur}
                onChange={(e) => setConfig((p) => ({ ...p, posterBlur: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--film-amber)' }}
              />
            </div>

            {/* Advanced mode link */}
            <div
              style={{
                marginTop: 'var(--space-8)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                paddingTop: 'var(--space-4)',
              }}
            >
              <button
                onClick={() => setBuilderMode('advanced')}
                style={{
                  width: '100%',
                  minHeight: 36,
                  background: 'rgba(196,124,46,0.08)',
                  border: '1px dashed rgba(196,124,46,0.3)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--film-amber)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: 'Syne, sans-serif',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(196,124,46,0.14)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(196,124,46,0.08)')
                }
              >
                More options in Advanced Mode
              </button>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div>
            {config.ratings.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-8) 0',
                  color: 'var(--film-text-ghost)',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                <Layers size={24} opacity={0.4} />
                No layers yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[...config.ratings].reverse().map((id) => {
                  const isSelected = selectedIds.has(id);
                  return (
                    <button
                      key={id}
                      onClick={(e) => onSelect(id, e.metaKey || e.ctrlKey || e.shiftKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        minHeight: 44,
                        background: isSelected
                          ? 'rgba(196,124,46,0.12)'
                          : 'transparent',
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'rgba(196,124,46,0.3)'
                          : 'rgba(255,255,255,0.04)',
                        borderRadius: 'var(--radius-xs)',
                        color: isSelected ? 'var(--film-amber)' : 'var(--film-text-label)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                        fontFamily: 'Syne, sans-serif',
                      }}
                    >
                      {id.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerPanelSimple;
