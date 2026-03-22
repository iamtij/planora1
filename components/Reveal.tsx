import React, { useEffect, useRef, useState } from 'react';

export type RevealVariant = 'fadeUp' | 'fade' | 'image' | 'cta';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: RevealVariant;
  /** Above-the-fold: start visible and skip scroll observer */
  priority?: boolean;
}

const variantConfig: Record<
  RevealVariant,
  { hidden: string; visible: string; duration: string; ease: string }
> = {
  fadeUp: {
    hidden: 'opacity-0 translate-y-6',
    visible: 'opacity-100 translate-y-0',
    duration: 'duration-[1300ms]',
    ease: 'ease-out',
  },
  fade: {
    hidden: 'opacity-0',
    visible: 'opacity-100',
    duration: 'duration-[1000ms]',
    ease: 'ease-out',
  },
  image: {
    hidden: 'opacity-0 scale-[1.03]',
    visible: 'opacity-100 scale-100',
    duration: 'duration-[1600ms]',
    ease: 'ease-out',
  },
  cta: {
    hidden: 'opacity-0 translate-y-10',
    visible: 'opacity-100 translate-y-0',
    duration: 'duration-[1600ms]',
    ease: 'ease-[cubic-bezier(0.22,1,0.36,1)]',
  },
};

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
  variant = 'fadeUp',
  priority = false,
}) => {
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' ? getPrefersReducedMotion() : false
  );
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Reduced motion: show immediately. Otherwise start hidden so enter transitions can run.
    return getPrefersReducedMotion();
  });
  const ref = useRef<HTMLDivElement>(null);

  /** Priority (e.g. hero): mount hidden, then reveal after paint — otherwise first frame is already "visible" and CSS skips the transition. */
  useEffect(() => {
    if (!priority || reducedMotion) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, [priority, reducedMotion]);

  useEffect(() => {
    if (priority || reducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const el = ref.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, reducedMotion]);

  const cfg = variantConfig[variant];
  const motionSafe = !reducedMotion;

  return (
    <div
      ref={ref}
      className={`transform transition-all ${motionSafe ? cfg.duration : 'duration-0'} ${
        motionSafe ? cfg.ease : ''
      } ${motionSafe ? '' : 'transition-none'} ${isVisible ? cfg.visible : cfg.hidden} ${className}`}
      style={{
        transitionDelay: motionSafe && isVisible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  );
};

export default Reveal;
