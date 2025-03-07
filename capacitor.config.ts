import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentalgoals.app',
  appName: 'MentalGoals',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com',
      iosClientId: '629190984804-oqit9rd3t8rb7jucei1lq8g236c1bpjg.apps.googleusercontent.com',
      androidClientId: '629190984804-hihuo9k8tj6bn2f3pm3b3omgfiqdualp.apps.googleusercontent.com'
    }
  }
};

export default config;
