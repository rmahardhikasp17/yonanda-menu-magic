import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nekatdigital.hotelyonanda',
  appName: 'Hotel Yonanda',
  webDir: 'dist',

  // Android-specific configuration
  android: {
    // Allow mixed content for local assets
    allowMixedContent: true,
    // Enable WebView debugging (disable in production)
    webContentsDebuggingEnabled: true,
  },

  server: {
    // Use HTTPS scheme — critical for IndexedDB origin persistence
    androidScheme: 'https',
  },

  plugins: {
    // Splash screen config
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
