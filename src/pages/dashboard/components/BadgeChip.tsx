// src/pages/dashboard/components/BadgeChip.tsx
import React from 'react';
import type { BadgeData } from '../types';

interface Props {
  badge: BadgeData;
}

const BadgeChip: React.FC<Props> = ({ badge }) => (
  <span
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
    style={{ background: badge.bg, borderColor: badge.border, color: badge.color }}
  >
    <span className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
      {badge.icon}
    </span>
    {badge.label}
  </span>
);

export default BadgeChip;