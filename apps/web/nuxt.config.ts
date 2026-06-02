// https://nuxt.com/docs/api/configuration/nuxt-config

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-07-03' as const,
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  debug: process.env.NODE_ENV !== 'production',
  ssr: false, // 클라이언트 전용 SPA 모드
  experimental: {
    // ssr:false + vite-builder 4.4.5 버그 우회: resolveServerEntry가 client config에서 input.server를 찾지 못하는 문제
    // viteEnvironmentApi 활성화 시 단일 Vite 서버에 SSR 환경이 포함되어 entry-spa를 정상 인식
    viteEnvironmentApi: true,
  },
  alias: {
    // '@core': '../../core/src'
  },
  runtimeConfig: {
    // 서버에서만 사용 (CF Pages Functions 환경)
    // 프로덕션: CF Pages 환경변수 NUXT_API_BASE 에 Worker URL 설정
    apiBase: process.env.NUXT_API_BASE ?? 'http://localhost:8787',
  },
  vite: {
    build: {
      sourcemap: process.env.NODE_ENV !== 'production',
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
        },

        '/go': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
  // css: ['~/assets/css/tailwind.css'],
  modules: [
    '@pinia/nuxt',
    // '@vite-pwa/nuxt',
    // '@nuxtjs/tailwindcss',
    // '@nuxtjs/color-mode',
  ],

  nitro: {
    preset: process.env.NODE_ENV === 'production' ? 'cloudflare-pages' : undefined,
    routeRules: {
      '/api/**': {
        proxy: `${process.env.NUXT_API_BASE ?? 'http://localhost:8787'}/api/**`,
      },
      '/trpc/**': { proxy: `${process.env.NUXT_API_BASE ?? 'http://localhost:8787'}/trpc/**` },
      '/rpc/**': { proxy: `${process.env.NUXT_API_BASE ?? 'http://localhost:8787'}/rpc/**` },
    },
  },
  app: {
    rootId: 'voc',
    spaLoaderAttrs: {
      id: 'voc-loader',
    },
    head: {
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
    // buildAssetsDir: '/assets/',
  },
})
