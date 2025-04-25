export interface MentalGoalsConfig {
  ID_TOKEN: string;
  API_URL: string;
  GOOGLE_CLIENT_ID: string;
  DEFAULT_LANGUAGE: string;
  DOMAIN: string;
  JWT_PATH: string;
  API_BASE: string;
  API_WP_BASE: string;
  PLATFORM: {
    IOS: string;
    ANDROID: string;
    WEB: string;
  };
  THEME: {
    PRIMARY: string;
    SECONDARY: string;
  };
  LOGO_IMAGE: string;
  DEFAULT_IMAGE: string;
  VERSION: string;
  setToken: (token: string) => void;
}

const config: MentalGoalsConfig = {
  ID_TOKEN: '',
  API_URL: 'http://localhost:3000',
  GOOGLE_CLIENT_ID: '316790340348-8ebvi6dun25a1h8l22pdeinl32tqkaj0.apps.googleusercontent.com', //'629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com',
  DEFAULT_LANGUAGE: 'en',
  DOMAIN: 'https://mental-goals.com',
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
  VERSION: '0.0.1',
  setToken: function(token: string) {
    this.ID_TOKEN = token;
  }
};

export const appConfig = config;
