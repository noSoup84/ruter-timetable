/// <reference types="vitest/config" />
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/
  base: '/ruter-timetable/',
  plugins: [vue()],
  test: {
    env: { TZ: 'Europe/Oslo' },
  },
})
