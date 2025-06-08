import { useState, useEffect } from 'react';

// Breakpoint definitions (matching Tailwind CSS defaults)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect current screen size and provide responsive utilities
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect is only run on mount and unmount

  // Helper functions to check breakpoints
  const isXs = windowSize.width < breakpoints.sm;
  const isSm = windowSize.width >= breakpoints.sm && windowSize.width < breakpoints.md;
  const isMd = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isLg = windowSize.width >= breakpoints.lg && windowSize.width < breakpoints.xl;
  const isXl = windowSize.width >= breakpoints.xl && windowSize.width < breakpoints['2xl'];
  const is2Xl = windowSize.width >= breakpoints['2xl'];

  // Helper functions for common responsive conditions
  const isMobile = windowSize.width < breakpoints.md; // xs and sm
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg; // md
  const isDesktop = windowSize.width >= breakpoints.lg; // lg, xl, and 2xl
  
  /**
   * Returns value based on current breakpoint
   * @param values Object with breakpoint keys and corresponding values
   * @param defaultValue Default value if no breakpoint matches
   */
  const responsive = <T>(values: Partial<Record<Breakpoint | 'xs', T>>, defaultValue?: T): T => {
    if (is2Xl && values['2xl'] !== undefined) return values['2xl'];
    if (isXl && values.xl !== undefined) return values.xl;
    if (isLg && values.lg !== undefined) return values.lg;
    if (isMd && values.md !== undefined) return values.md;
    if (isSm && values.sm !== undefined) return values.sm;
    if (isXs && values.xs !== undefined) return values.xs;
    
    // Find the largest breakpoint that has a value
    const breakpointKeys: (Breakpoint | 'xs')[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    for (const key of breakpointKeys) {
      if (values[key] !== undefined) return values[key] as T;
    }
    
    // Return default value if provided
    if (defaultValue !== undefined) return defaultValue;
    
    // Otherwise return the first value or undefined
    const firstValue = Object.values(values)[0];
    return firstValue as T;
  };

  return {
    width: windowSize.width,
    height: windowSize.height,
    breakpoints,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    responsive,
  };
}

export default useResponsive; 