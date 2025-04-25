import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentalgoals.app',
  appName: 'Mental Goals',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    url: 'https://localhost:4200',
    allowNavigation: [
      'localhost:*',
      'https://localhost:*',
      'https://127.0.0.1:*',
      'https://localhost:4200',
      'https://127.0.0.1:4200',
      'https://localhost:4200/auth',
      'https://127.0.0.1:4200/auth',
      'https://localhost:4200/auth/callback',
      'https://127.0.0.1:4200/auth/callback',
      'https://localhost:4200/auth/google/callback',
      'https://127.0.0.1:4200/auth/google/callback',
      'https://accounts.google.com',
      'https://*.google.com',
      'https://*.googleapis.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com'
    ],
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://*.google.com',
        'https://*.googleapis.com',
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://www.googletagmanager.com',
        'https://*.googletagmanager.com'
      ],
      'connect-src': [
        "'self'",
        'https://*.google.com',
        'https://*.googleapis.com',
        'https://accounts.google.com',
        'https://apis.google.com',
        'https://www.googletagmanager.com',
        'https://*.googletagmanager.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https://*.google.com',
        'https://*.googleapis.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://*.google.com',
        'https://*.googleapis.com'
      ],
      'font-src': ["'self'", 'data:']
    }
  },
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
