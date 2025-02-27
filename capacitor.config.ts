import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'MentalGoals',
  webDir: 'www',
  // bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId: "", // Це значення змінюємо в коді перед ініціалізацією
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
