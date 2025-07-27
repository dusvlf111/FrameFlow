/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'FrameFlow - Video to Comic Converter',
        short_name: 'FrameFlow',
        description: 'Convert videos to comics frame by frame with subtitle support',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 관련 라이브러리
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          // 라우터 관련
          if (id.includes('react-router')) {
            return 'router';
          }
          // i18n 관련
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n';
          }
          // PDF 관련 대용량 라이브러리
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-tools';
          }
          // 기타 유틸리티
          if (id.includes('dompurify')) {
            return 'utils';
          }
          // node_modules의 다른 라이브러리들
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // 청크 크기 경고 임계값을 1MB로 증가
    chunkSizeWarningLimit: 1000
  },
})
