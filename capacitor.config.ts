import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentalgoals.app',
  appName: 'Mental Goals',
  webDir: 'www',
  plugins: {
    Preferences: {
      group: 'com.mentalgoals.app.preferences'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '316790340348-vj8r1hv5a7qmvtqk4v1f5h7qi5uf5g7q.apps.googleusercontent.com',
      androidClientId: '316790340348-vj8r1hv5a7qmvtqk4v1f5h7qi5uf5g7q.apps.googleusercontent.com',
      iosClientId: '316790340348-vj8r1hv5a7qmvtqk4v1f5h7qi5uf5g7q.apps.googleusercontent.com',
      webClientId: '316790340348-vj8r1hv5a7qmvtqk4v1f5h7qi5uf5g7q.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    FirebaseAnalytics: {
      enabled: true,
      collectionEnabled: true,
      screenTrackingEnabled: true,
      automaticScreenReports: true,
      userPropertyTrackingEnabled: true
    }
  }
};

export default config;
