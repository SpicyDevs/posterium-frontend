import { memo, forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onActivate?: () => void;
}

const SearchInput = memo(
  forwardRef<HTMLInputElement, SearchInputProps>(
    ({ onActivate, style, className, ...props }, ref) => {
      return (
        <div
          style={{
            height: 34,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 10px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--film-text-dim)',
            ...style,
          }}
          className={className}
        >
          <Search size={13} style={{ flexShrink: 0 }} />
          <input
            ref={ref}
            type="text"
            onFocus={() => onActivate?.()}
            aria-label={props.placeholder ?? 'Search'}
            className="syne-font focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C47C2E] focus-visible:outline-offset-2 rounded-sm"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--film-cream)',
              fontSize: 11,
              letterSpacing: '0.02em',
            }}
            {...props}
          />
        </div>
      );
    }
  )
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
