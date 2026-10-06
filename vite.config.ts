/// <reference types="vitest/config" />
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages cannot send headers, so the policy goes in a meta tag.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  'connect-src https://api.entur.io',
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY }, injectTo: 'head-prepend' },
    ],
  }
}

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/
  base: '/ruter-timetable/',
  plugins: [vue(), contentSecurityPolicy()],
  test: {
    env: { TZ: 'Europe/Oslo' },
  },
})
