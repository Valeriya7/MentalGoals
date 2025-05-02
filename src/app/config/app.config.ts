import { Injectable } from '@angular/core';
import { firebaseConfig } from './firebase.config';
import { googleAuthConfig } from './google-auth.config';

export interface AppConfig {
  VERSION: string;
  firebase: typeof firebaseConfig;
  googleAuth: typeof googleAuthConfig;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService implements AppConfig {
  VERSION = '0.0.1';
  firebase = firebaseConfig;
  googleAuth = googleAuthConfig;
}

export const appConfig: AppConfig = {
  VERSION: '0.0.1',
  firebase: firebaseConfig,
  googleAuth: googleAuthConfig
};
