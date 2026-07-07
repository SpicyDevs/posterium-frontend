import { memo, type ReactNode } from 'react';
import Card from './Card';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
}

const EmptyState = memo<EmptyStateProps>(({ message, icon }) => {
  return (
    <Card variant="default" padding="md">
      <div
        className="syne-font"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--film-text-dim)',
          fontSize: 13,
        }}
      >
        {icon}
        {message}
      </div>
    </Card>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
