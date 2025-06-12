import { useIsFetching } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * Displays a thin animated gradient bar at the very top of the viewport whenever
 * there is at least one active React Query fetch. This gives global feedback
 * that background data is loading without requiring per-page spinners.
 */
export function LoadingIndicatorProvider() {
  const isFetching = useIsFetching();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFetching > 0) {
      setVisible(true);
    } else {
      // delay hiding slightly so quick flashes are not jarring
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[100] h-1 w-full animate-pulse bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
      style={{ pointerEvents: 'none' }}
    />
  );
} 