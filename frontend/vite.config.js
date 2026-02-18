import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  },
  build: {
    // Task 32.2: Frontend performance optimizations
    
    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks
        manualChunks: {
          // React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components and utilities
          'ui-vendor': ['lucide-react'],
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Generate source maps for debugging (disable in production if needed)
    sourcemap: false,
    
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  }
});
