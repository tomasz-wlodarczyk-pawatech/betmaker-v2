import { useMemo, useCallback } from 'react';

// Optimized font loading
export function preloadFonts() {
  if (typeof window !== 'undefined') {
    const fontUrls = [
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
    ];
    
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      document.head.appendChild(link);
      
      // Also add the actual stylesheet
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = url;
      document.head.appendChild(stylesheet);
    });
  }
}

// Debounce hook for performance optimization
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), delay);
      }) as T;
    }, [callback, delay]),
    [callback, delay]
  );
}

// Throttle hook for high-frequency events
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useCallback(
    useMemo(() => {
      let lastCall = 0;
      return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return callback(...args);
        }
      }) as T;
    }, [callback, delay]),
    [callback, delay]
  );
}

// Memoization hook for expensive computations
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(() => {
    const start = performance.now();
    const result = factory();
    const end = performance.now();
    
    if (end - start > 16) { // More than one frame
      console.warn(`Expensive computation took ${end - start}ms`);
    }
    
    return result;
  }, deps);
}

// Performance measurement utility
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start}ms`);
  return result;
}

// Image optimization utility
export function optimizeImage(src: string, width?: number, height?: number): string {
  if (!src) return '';
  
  // If it's already optimized or external, return as-is
  if (src.includes('?') || src.startsWith('http')) {
    return src;
  }
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', '80'); // Quality
  params.set('f', 'webp'); // Format
  
  return `${src}?${params.toString()}`;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  return useCallback((element: Element | null) => {
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          element.setAttribute('data-visible', 'true');
        }
      });
    }, defaultOptions);

    observer.observe(element);
    return () => observer.disconnect();
  }, []);
}