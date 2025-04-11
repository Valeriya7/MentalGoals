import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TranslateService } from './services/translate.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { StorageService } from './services/storage.service';

export function initializeStorage(storageService: StorageService) {
  return () => storageService.init();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    IonicStorageModule.forRoot({
      driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
    }),
    HttpClientModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    TranslateService,
    GoogleAuth,
    StorageService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeStorage,
      multi: true,
      deps: [StorageService]
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {} 