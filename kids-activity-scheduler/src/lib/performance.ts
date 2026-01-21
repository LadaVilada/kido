// Performance monitoring utilities

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

// Report Web Vitals
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // In production, you could send to analytics service
  // Example: sendToAnalytics(metric);
}

// Measure component render time
export function measureRender(componentName: string, callback: () => void) {
  const startTime = performance.now();
  callback();
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
  }
  
  return renderTime;
}

// Check if device is low-end
export function isLowEndDevice(): boolean {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check for save-data header
  const saveData = (navigator as any).connection?.saveData;
  
  // Check for slow connection
  const slowConnection = (navigator as any).connection?.effectiveType === 'slow-2g' || 
                         (navigator as any).connection?.effectiveType === '2g';
  
  // Check for low memory
  const lowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
  
  // Check for low CPU cores
  const lowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  return prefersReducedMotion || saveData || slowConnection || lowMemory || lowCPU;
}

// Preload critical resources
export function preloadResource(url: string, type: 'script' | 'style' | 'font' | 'image') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = type;
  
  if (type === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

// Lazy load images with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        const src = image.dataset.src;
        
        if (src) {
          image.src = src;
          image.removeAttribute('data-src');
          observer.unobserve(image);
        }
      }
    });
  });
  
  observer.observe(img);
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request idle callback wrapper
export function runWhenIdle(callback: () => void, timeout = 2000) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}