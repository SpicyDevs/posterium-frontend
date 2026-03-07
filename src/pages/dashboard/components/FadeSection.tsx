// src/pages/dashboard/components/FadeSection.tsx
import React from 'react';
import { useInView } from '../hooks/useInView';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wraps children in a div that fades + slides up once it enters the viewport.
 * Uses IntersectionObserver (fires only once, then disconnects).
 */
const FadeSection: React.FC<Props> = ({ children, className = '', delay = 0 }) => {
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};

export default FadeSection;