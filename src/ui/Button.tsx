import { memo, forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'amber';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--film-amber)',
    color: '#070706',
    border: '1px solid rgba(196,124,46,0.25)',
    boxShadow: '0 0 18px rgba(196,124,46,0.22)',
  },
  secondary: {
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--film-cream)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--film-text-label)',
    border: '1px solid transparent',
  },
  amber: {
    background: 'rgba(196,124,46,0.14)',
    color: 'var(--film-cream)',
    border: '1px solid rgba(196,124,46,0.28)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    fontSize: 10,
    padding: '6px 10px',
    borderRadius: 6,
  },
  md: {
    fontSize: 11,
    padding: '8px 14px',
    borderRadius: 8,
  },
  lg: {
    fontSize: 12,
    padding: '10px 18px',
    borderRadius: 8,
  },
};

const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant = 'secondary',
        size = 'md',
        children,
        leftIcon,
        rightIcon,
        fullWidth = false,
        style,
        className,
        ...props
      },
      ref
    ) => {
      const baseStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'opacity 0.15s ease, background 0.15s ease',
        width: fullWidth ? '100%' : undefined,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      };

      return (
        <button
          ref={ref}
          className={`syne-font${className ? ` ${className}` : ''}`}
          style={baseStyle}
          {...props}
        >
          {leftIcon}
          {children}
          {rightIcon}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

export default Button;
