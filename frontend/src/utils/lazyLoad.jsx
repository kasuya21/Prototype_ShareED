/**
 * Lazy Loading Utility
 * Task 32.2: Implement lazy loading for better performance
 * 
 * This utility provides a wrapper for React.lazy with loading states
 * and error boundaries for better user experience
 */

import { lazy, Suspense } from 'react';

/**
 * Loading component displayed while lazy component is loading
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Error boundary component for lazy loaded components
 */
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load component</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy load a component with loading state and error boundary
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Options for lazy loading
 * @returns {React.Component} - Lazy loaded component wrapped with Suspense
 */
export function lazyLoad(importFunc, options = {}) {
  const {
    fallback = <LoadingFallback />,
    errorBoundary = true
  } = options;

  const LazyComponent = lazy(importFunc);

  return function LazyLoadedComponent(props) {
    const component = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );

    if (errorBoundary) {
      return <LazyErrorBoundary>{component}</LazyErrorBoundary>;
    }

    return component;
  };
}

/**
 * Preload a lazy component
 * Useful for preloading components on hover or other user interactions
 * @param {Function} importFunc - Dynamic import function
 */
export function preloadComponent(importFunc) {
  importFunc();
}

export default lazyLoad;
