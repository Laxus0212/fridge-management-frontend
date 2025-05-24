import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.varadinas.fridgemanager',
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
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      androidClientId: '277078751696-1dt5l3i9uneajuggipj8upr71t65qh3o.apps.googleusercontent.com',
      serverClientId: '277078751696-1dt5l3i9uneajuggipj8upr71t65qh3o.apps.googleusercontent.com',
      clientId: '277078751696-1dt5l3i9uneajuggipj8upr71t65qh3o.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
