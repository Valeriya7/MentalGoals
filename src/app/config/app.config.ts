export class AppConfig {
  private static instance: AppConfig;
  private _idToken: string | null = null;

  private constructor() {}

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  get ID_TOKEN(): string | null {
    return this._idToken;
  }

  set ID_TOKEN(value: string | null) {
    this._idToken = value;
  }

  // Інші конфігураційні параметри
  readonly API_URL: string = 'http://localhost:3000';
  readonly GOOGLE_CLIENT_ID: string = '316790340348-8ebvi6dun25a1h8l22pdeinl32tqkaj0.apps.googleusercontent.com'; //'629190984804-no655ouoceoo29td33q34f32ek2eanne.apps.googleusercontent.com';
  readonly DEFAULT_LANGUAGE: string = 'en';
  readonly DOMAIN: string = 'https://mental-goals.com';
  readonly JWT_PATH: string = '/wp-json/jwt-auth/v1/token';
  readonly API_BASE: string = '/wp-json/api/v1/';
  readonly API_WP_BASE: string = '/wp-json/wp/v2/';
  readonly PLATFORM = {
    IOS: 'ios-specific-value',
    ANDROID: 'android-specific-value',
    WEB: 'web-specific-value',
  };
  readonly THEME = {
    PRIMARY: '#45a096',
    SECONDARY: '#3e3d3f'
  };
  readonly LOGO_IMAGE: string = './assets/imgs/logo_signet_sa.png';
  readonly DEFAULT_IMAGE: string = './assets/imgs/default.png';
  readonly VERSION: string = '0.0.1';
}

export const appConfig = AppConfig.getInstance();
