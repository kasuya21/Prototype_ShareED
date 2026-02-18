/**
 * Performance Monitoring Utilities
 * Task 32.2: Monitor and optimize frontend performance
 * 
 * Provides utilities for measuring and monitoring performance metrics
 */

/**
 * Measure component render time
 * @param {string} componentName - Name of the component
 * @param {Function} callback - Callback function to execute
 */
export function measureRenderTime(componentName, callback) {
  const startTime = performance.now();
  
  callback();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 16) { // Warn if render takes longer than one frame (16ms)
    console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
  }
  
  return duration;
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure Web Vitals (Core Web Vitals)
 */
export function measureWebVitals() {
  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            console.log('CLS:', clsScore);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }
}

/**
 * Get navigation timing metrics
 * @returns {Object} - Navigation timing metrics
 */
export function getNavigationMetrics() {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  
  return {
    // DNS lookup time
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    
    // TCP connection time
    tcp: timing.connectEnd - timing.connectStart,
    
    // Time to first byte
    ttfb: timing.responseStart - timing.requestStart,
    
    // Content download time
    download: timing.responseEnd - timing.responseStart,
    
    // DOM processing time
    domProcessing: timing.domComplete - timing.domLoading,
    
    // Total page load time
    pageLoad: timing.loadEventEnd - timing.navigationStart,
    
    // DOM ready time
    domReady: timing.domContentLoadedEventEnd - timing.navigationStart
  };
}

/**
 * Log performance metrics to console
 */
export function logPerformanceMetrics() {
  const metrics = getNavigationMetrics();
  
  if (metrics) {
    console.group('Performance Metrics');
    console.log('DNS Lookup:', `${metrics.dns}ms`);
    console.log('TCP Connection:', `${metrics.tcp}ms`);
    console.log('Time to First Byte:', `${metrics.ttfb}ms`);
    console.log('Content Download:', `${metrics.download}ms`);
    console.log('DOM Processing:', `${metrics.domProcessing}ms`);
    console.log('DOM Ready:', `${metrics.domReady}ms`);
    console.log('Page Load:', `${metrics.pageLoad}ms`);
    console.groupEnd();
  }
}

/**
 * React hook for measuring component performance
 */
export function usePerformance(componentName) {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(`${componentName} was mounted for ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Detect slow network connection
 * @returns {boolean} - Whether connection is slow
 */
export function isSlowConnection() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      // Check if connection is 2G or slow-2g
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
  }
  
  return false;
}

/**
 * Prefetch resources
 * @param {Array<string>} urls - URLs to prefetch
 */
export function prefetchResources(urls) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Measure API call performance
 * @param {string} endpoint - API endpoint
 * @param {Function} apiCall - API call function
 * @returns {Promise} - API call result with timing
 */
export async function measureApiCall(endpoint, apiCall) {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`API call to ${endpoint} took ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`API call to ${endpoint} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      logPerformanceMetrics();
      measureWebVitals();
    }, 0);
  });
}

export default {
  measureRenderTime,
  debounce,
  throttle,
  measureWebVitals,
  getNavigationMetrics,
  logPerformanceMetrics,
  usePerformance,
  isSlowConnection,
  prefetchResources,
  measureApiCall
};
