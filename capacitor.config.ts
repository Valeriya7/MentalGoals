import { CapacitorConfig } from '@capacitor/cli';
import { GOOGLE_OAUTH_CONFIG } from './src/app/constants/firebase.config';
import { APP_CONFIG } from './src/app/constants/firebase.config';

const config: CapacitorConfig = {
  appId: APP_CONFIG.android.packageName,
  appName: 'MentalGoals',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: GOOGLE_OAUTH_CONFIG.web.clientId,
      androidClientId: GOOGLE_OAUTH_CONFIG.android.clientId,
      iosClientId: GOOGLE_OAUTH_CONFIG.ios.clientId,
      forceCodeForRefreshToken: true,
      webClientId: GOOGLE_OAUTH_CONFIG.web.clientId
    }
  }
};

export default config; 