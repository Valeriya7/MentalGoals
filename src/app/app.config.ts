import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { IonicModule } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { appProviders } from './app.providers';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEn);

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(
      IonicModule.forRoot({
        mode: 'md',
        backButtonText: '',
        loadingSpinner: 'circular'
      })
    ),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'en' },
    importProvidersFrom(IonicStorageModule.forRoot({
      name: '__mentalgoalsdb',
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    })),
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      },
      defaultLanguage: 'en',
        useDefaultLang: true
    })),
    ...appProviders
  ]
}; 