/**
 * Image Optimization Utilities
 * Task 32.2: Optimize images for better performance
 * 
 * Provides utilities for lazy loading images, responsive images,
 * and image compression
 */

/**
 * Lazy load images using Intersection Observer
 * @param {HTMLImageElement} img - Image element to lazy load
 */
export function lazyLoadImage(img) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target;
          const src = image.dataset.src;
          
          if (src) {
            image.src = src;
            image.classList.remove('lazy');
            observer.unobserve(image);
          }
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = img.dataset.src;
  }
}

/**
 * React component for lazy loaded images
 */
export function LazyImage({ src, alt, className = '', ...props }) {
  const imgRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });

      observer.observe(img);

      return () => observer.disconnect();
    } else {
      img.src = src;
    }
  }, [src]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      onLoad={() => setIsLoaded(true)}
      {...props}
    />
  );
}

/**
 * Generate responsive image srcset
 * @param {string} baseUrl - Base URL of the image
 * @param {Array<number>} widths - Array of widths for responsive images
 * @returns {string} - srcset string
 */
export function generateSrcSet(baseUrl, widths = [320, 640, 960, 1280, 1920]) {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Get optimized image URL with size parameters
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  const {
    width,
    height,
    quality = 80,
    format = 'auto'
  } = options;

  if (!url) return '';

  // If it's a local upload, add query parameters for optimization
  const params = new URLSearchParams();
  
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  if (quality) params.append('q', quality);
  if (format) params.append('f', format);

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Compress image file before upload
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    type = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Preload critical images
 * @param {Array<string>} urls - Array of image URLs to preload
 */
export function preloadImages(urls) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Check if image format is supported
 * @param {string} format - Image format (webp, avif, etc.)
 * @returns {Promise<boolean>} - Whether format is supported
 */
export async function isFormatSupported(format) {
  const testImages = {
    webp: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
    avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  };

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = testImages[format];
  });
}

export default {
  lazyLoadImage,
  LazyImage,
  generateSrcSet,
  getOptimizedImageUrl,
  compressImage,
  preloadImages,
  isFormatSupported
};
