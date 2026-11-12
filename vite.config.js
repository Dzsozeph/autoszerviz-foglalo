
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import base44 from '@base44/vite-plugin'

export default defineConfig({
  base: '/autoszerviz-foglalo/',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: false,
      navigationNotifier: false,
      analyticsTracker: false,
      visualEditAgent: false
    }),
    react(),
  ],
})
