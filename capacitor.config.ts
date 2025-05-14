import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'fridge-management',
  webDir: 'www',
  server: {
    allowNavigation: ['varadinas.synology.me']
  },
  android: {
    allowMixedContent: true,
  },
  ios: {},
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false,
    }
  }
};

export default config;
