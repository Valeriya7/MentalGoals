import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import './polyfills';
import './zone-flags';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Ініціалізація Google Auth для Android
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize().catch((err: Error) => {
    console.error('Error initializing Google Auth:', err);
  });
}

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch(err =>
  console.error('Error bootstrapping app:', err)
);
