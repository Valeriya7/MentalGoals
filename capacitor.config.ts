import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentalgoals.app',
  appName: 'Mental Goals',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    Preferences: {
      group: 'com.mentalgoals.app.preferences'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '316790340348-8ebvi6dun25a1h8l22pdeinl32tqkaj0.apps.googleusercontent.com',
      androidClientId: '316790340348-plk1ussjj7s4gkuqd5hhcocaes4kk4dv.apps.googleusercontent.com',
      iosClientId: '316790340348-3ssptcb7gfgm3l3snnds4ublmblkt4q4.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
      grantOfflineAccess: true,
      webClientId: '316790340348-8ebvi6dun25a1h8l22pdeinl32tqkaj0.apps.googleusercontent.com',
      android: {
        signInOptions: {
          serverClientId: '316790340348-8ebvi6dun25a1h8l22pdeinl32tqkaj0.apps.googleusercontent.com'
        }
      }
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#ffffff'
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: '#ffffff',
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
