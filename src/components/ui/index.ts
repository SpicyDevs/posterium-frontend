// Shared UI Components
export { default as Button, type ButtonVariant, type ButtonSize } from './Button';
export { default as Card, type CardVariant } from './Card';
export { default as PageHeader } from './PageHeader';
export { default as SearchInput } from './SearchInput';
export { default as SegmentedControl } from './SegmentedControl';
export { default as EmptyState } from './EmptyState';
export { default as SectionHeading } from './SectionHeading';

// Re-export primitives for convenience
export {
  AmberTag,
  AmberDivider,
  SprocketStrip,
  FilmEdge,
  FilmCorners,
  MarqueeTicker,
} from '@/components/shared/primitives';
