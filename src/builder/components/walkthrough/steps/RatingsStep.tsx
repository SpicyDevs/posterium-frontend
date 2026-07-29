import { memo, useCallback } from 'react';
import type { RatingType } from '@/types/poster';
import { ALL_BADGES, BADGE_ICONS } from '@/constants/badges';
import { Check } from 'lucide-react';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface RatingsStepProps {
  ratings: RatingType[];
  onChange: (ratings: RatingType[]) => void;
}

const RatingsStep = memo<RatingsStepProps>(({ ratings, onChange }) => {
  const toggle = useCallback(
    (id: RatingType) => {
      if (ratings.includes(id)) {
        onChange(ratings.filter((r) => r !== id));
      } else {
        onChange([...ratings, id]);
      }
    },
    [ratings, onChange],
  );

  return (
    <div>
      <StepTitle>Choose Rating Badges</StepTitle>
      <StepSubtitle>
        Select which rating badges to show on your poster. All badges can be toggled later.
      </StepSubtitle>

      <div
        style={{
          maxHeight: 340,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(196,124,46,0.12) transparent',
        }}
      >
        {ALL_BADGES.map((badge) => {
          const active = ratings.includes(badge.id);
          const iconData = BADGE_ICONS[badge.id];

          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => toggle(badge.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'inherit',
                background: active ? 'rgba(196,124,46,0.06)' : 'transparent',
                border: 'none',
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = active
                  ? 'rgba(196,124,46,0.1)'
                  : 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = active
                  ? 'rgba(196,124,46,0.06)'
                  : 'transparent';
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  background: active ? 'var(--film-amber)' : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '1px solid rgba(196,124,46,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {active && <Check size={10} style={{ color: '#070706' }} />}
              </div>

              {iconData ? (
                <svg
                  width="18"
                  height="18"
                  viewBox={iconData.vb}
                  style={{ flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: iconData.body }}
                />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    flexShrink: 0,
                  }}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="syne-font"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: active ? 'var(--film-cream)' : 'var(--film-text-label)',
                    transition: 'color 0.15s',
                  }}
                >
                  {badge.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

RatingsStep.displayName = 'RatingsStep';
export default RatingsStep;
