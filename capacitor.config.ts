import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'MentalGoals',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "YOUR_WEB_CLIENT_ID", // Додайте ваш Web Client ID
      iosClientId: "YOUR_IOS_CLIENT_ID", // Додайте ваш iOS Client ID
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
