import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.simplespeak.app',
  appName: 'SimpleSpeak',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
