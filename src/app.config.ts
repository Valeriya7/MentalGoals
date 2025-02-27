export const APP_CONFIG = {
  DEFAULT_LANGUAGE: 'en',

  // Mntal Goals API
  DOMAIN: 'https://mental-goals.com',

  GOOGLE_CLIENT_ID: 'your-google-client-id', // Google Client ID для авторизації

  JWT_PATH: '/wp-json/jwt-auth/v1/token',
  API_BASE: '/wp-json/api/v1/',
  API_WP_BASE: '/wp-json/wp/v2/',

  PLATFORM: {
    IOS: 'ios-specific-value',
    ANDROID: 'android-specific-value',
    WEB: 'web-specific-value',
  },

  THEME: {
    PRIMARY: '#45a096',
    SECONDARY: '#3e3d3f'
  },
  LOGO_IMAGE: './assets/imgs/logo_signet_sa.png',
  DEFAULT_IMAGE: './assets/imgs/default.png',
  VERSION: '0.0.1', // Версія додатку
};
