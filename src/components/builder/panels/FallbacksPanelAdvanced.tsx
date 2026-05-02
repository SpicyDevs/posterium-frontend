// src/components/builder/panels/FallbacksPanelAdvanced.tsx
import React from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Minus } from 'lucide-react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import type { RatingType } from '../types';

const ALL_RATINGS: RatingType[] = [
  'imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta',
  'tmdb', 'age', 'runtime', 'year', 'title', 'mal', 'anilist',
];

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 8,
};

/**
 * Advanced fallbacks panel — two drag-sortable lists:
 * Active ratings (top) and fallback pool (bottom).
 */
const FallbacksPanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => {
  const activeRatings = config.ratings;
  const pool = config.fallbackPool ?? [];
  const available = ALL_RATINGS.filter(
    (r) => !activeRatings.includes(r) && !pool.includes(r)
  );

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId === 'active' && destination.droppableId === 'active') {
      const items = [...activeRatings];
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      setConfig((p) => ({ ...p, ratings: items }));
    } else if (source.droppableId === 'pool' && destination.droppableId === 'pool') {
      const items = [...pool];
      const [moved] = items.splice(source.index, 1);
      items.splice(destination.index, 0, moved);
      setConfig((p) => ({ ...p, fallbackPool: items }));
    } else if (source.droppableId === 'active' && destination.droppableId === 'pool') {
      const active = [...activeRatings];
      const poolItems = [...pool];
      const [moved] = active.splice(source.index, 1);
      poolItems.splice(destination.index, 0, moved);
      setConfig((p) => ({ ...p, ratings: active, fallbackPool: poolItems }));
    } else if (source.droppableId === 'pool' && destination.droppableId === 'active') {
      const active = [...activeRatings];
      const poolItems = [...pool];
      const [moved] = poolItems.splice(source.index, 1);
      active.splice(destination.index, 0, moved);
      setConfig((p) => ({ ...p, ratings: active, fallbackPool: poolItems }));
    }
  };

  const renderItem = (id: RatingType, index: number, droppableId: string) => (
    <Draggable key={id} draggableId={`${droppableId}-${id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 8px',
            background: snapshot.isDragging
              ? 'rgba(196,124,46,0.15)'
              : 'rgba(255,255,255,0.03)',
            border: '1px solid',
            borderColor: snapshot.isDragging
              ? 'rgba(196,124,46,0.4)'
              : 'rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-xs)',
            marginBottom: 3,
            cursor: 'grab',
            fontSize: 11,
            color: 'var(--film-text-label)',
            fontFamily: 'Syne, sans-serif',
            ...provided.draggableProps.style,
          }}
        >
          <span
            {...provided.dragHandleProps}
            style={{ color: 'var(--film-text-ghost)', flexShrink: 0, display: 'flex' }}
          >
            <GripVertical size={13} />
          </span>
          <span style={{ flex: 1, textTransform: 'capitalize' }}>{id.replace('_', ' ')}</span>
        </div>
      )}
    </Draggable>
  );

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Active list */}
        <div style={{ marginBottom: 20 }}>
          <label style={LABEL}>Active Ratings ({activeRatings.length})</label>
          <Droppable droppableId="active">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minHeight: 44,
                  padding: 4,
                  background: snapshot.isDraggingOver ? 'rgba(196,124,46,0.04)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                {activeRatings.map((id, i) => renderItem(id, i, 'active'))}
                {provided.placeholder}
                {activeRatings.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--film-text-ghost)', fontSize: 11, padding: 12 }}>
                    Drag ratings here
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        {/* Fallback pool */}
        <div>
          <label style={LABEL}>Fallback Pool ({pool.length})</label>
          <Droppable droppableId="pool">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minHeight: 44,
                  padding: 4,
                  background: snapshot.isDraggingOver ? 'rgba(196,124,46,0.04)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background var(--transition-fast)',
                }}
              >
                {pool.map((id, i) => renderItem(id, i, 'pool'))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Available to add */}
        {available.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <label style={LABEL}>Available to Add</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {available.map((id) => (
                <button
                  key={id}
                  onClick={() => setConfig((p) => ({ ...p, ratings: [...p.ratings, id] }))}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)',
                    color: 'var(--film-text-dim)', fontSize: 10, cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif', textTransform: 'capitalize',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,124,46,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  <Plus size={10} />{id.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </DragDropContext>
    </div>
  );
};

export default FallbacksPanelAdvanced;
