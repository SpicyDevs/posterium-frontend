// src/components/installation/StepProgress.tsx
/**
 * Vertical step progress tracker for installation guides.
 * - IntersectionObserver highlights the active step as you scroll.
 * - localStorage persists checkbox completion state per guide.
 * - Horizontal progress bar on mobile.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  /** Optional estimated time in minutes */
  estimatedTime?: number;
}

interface StepProgressProps {
  /** Unique key used for localStorage persistence */
  guideId: string;
  steps: Step[];
}

function getStorageKey(guideId: string) {
  return `posterium_steps_${guideId}`;
}

function loadChecked(guideId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getStorageKey(guideId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveChecked(guideId: string, checked: Set<string>) {
  try {
    localStorage.setItem(getStorageKey(guideId), JSON.stringify([...checked]));
  } catch {}
}

export const StepProgress: React.FC<StepProgressProps> = ({ guideId, steps }) => {
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked(guideId));
  const [activeId, setActiveId] = useState<string | null>(steps[0]?.id ?? null);

  // Observe step sections on the page
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Pick the topmost visible section
          const sorted = [...visible].sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(sorted[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    steps.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [steps]);

  const toggleCheck = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveChecked(guideId, next);
        return next;
      });
    },
    [guideId]
  );

  const completedCount = checked.size;
  const totalCount = steps.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <nav aria-label="Installation progress" style={{ position: 'sticky', top: 80 }}>
      {/* Horizontal bar (visible on mobile via CSS) */}
      <div
        className="step-progress-bar-wrap"
        style={{
          marginBottom: 16,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 99,
          height: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, var(--film-amber), #E5C06A)',
            borderRadius: 99,
            transition: 'width var(--transition-spring)',
          }}
        />
      </div>

      {/* Completion chip */}
      <div
        className="syne-font"
        style={{
          fontSize: 10,
          color: 'var(--film-text-ghost)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        {completedCount}/{totalCount} complete
      </div>

      {/* Step list */}
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {steps.map(({ id, label, estimatedTime }, i) => {
          const isActive = activeId === id;
          const isDone = checked.has(id);

          return (
            <li key={id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: isActive ? 'rgba(196,124,46,0.08)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(196,124,46,0.2)' : 'transparent'}`,
                  transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                  cursor: 'pointer',
                }}
                onClick={() => toggleCheck(id)}
              >
                {/* Check button */}
                <button
                  aria-label={isDone ? `Mark step ${i + 1} incomplete` : `Mark step ${i + 1} complete`}
                  aria-pressed={isDone}
                  onClick={(e) => { e.stopPropagation(); toggleCheck(id); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', flexShrink: 0, marginTop: 1,
                    color: isDone ? '#6ee7b7' : isActive ? 'var(--film-amber)' : 'var(--film-text-ghost)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {isDone ? <CheckCircle size={15} /> : <Circle size={15} />}
                </button>

                {/* Label */}
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    flex: 1, textDecoration: 'none',
                    fontSize: 12,
                    color: isActive ? 'var(--film-cream)' : isDone ? 'var(--film-text-dim)' : 'var(--film-text-label)',
                    fontWeight: isActive ? 700 : 400,
                    lineHeight: 1.4,
                    transition: 'color var(--transition-fast)',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  <span className="mono-font" style={{ fontSize: 9, color: 'var(--film-amber)', marginRight: 5, opacity: 0.7 }}>
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  {label}
                  {estimatedTime != null && (
                    <span style={{ display: 'block', fontSize: 9, color: 'var(--film-text-ghost)', marginTop: 1, letterSpacing: '0.06em' }}>
                      ~{estimatedTime}m
                    </span>
                  )}
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepProgress;
