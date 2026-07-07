import { memo, type ReactNode, type CSSProperties } from 'react';

export type CardVariant = 'default' | 'elevated' | 'bordered';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'article' | 'section';
}

const variantStyles: Record<CardVariant, CSSProperties> = {
  default: {
    border: '1px solid rgba(196,124,46,0.14)',
    background: 'rgba(24,22,18,0.6)',
  },
  elevated: {
    border: '1px solid rgba(196,124,46,0.16)',
    background: 'linear-gradient(180deg, rgba(24,22,18,0.72), rgba(11,10,9,0.84))',
  },
  bordered: {
    border: '1px solid rgba(196,124,46,0.14)',
    background: 'rgba(14,13,11,0.72)',
  },
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', CSSProperties> = {
  none: { padding: 0 },
  sm: { padding: 10 },
  md: { padding: 14 },
  lg: { padding: 18 },
};

const Card = memo<CardProps>(
  ({ children, variant = 'default', padding = 'md', className, style, as: Component = 'div' }) => {
    const baseStyle: CSSProperties = {
      borderRadius: 10,
      overflow: 'hidden',
      ...variantStyles[variant],
      ...paddingStyles[padding],
      ...style,
    };

    return (
      <Component className={className} style={baseStyle}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;
