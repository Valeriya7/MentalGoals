import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlatformCheckService } from './services/platform-check.service';
import { VersionCheckService } from './services/version-check.service';
import './utils/icons'; // Імпортуємо централізовану реєстрацію іконок
import { TranslateService } from './services/translate.service';

import { Preferences } from '@capacitor/preferences';
import { FirebaseService } from './services/firebase.service';

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AppComponent {
  platformType: string = '';

  constructor(
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService,
    private translateService: TranslateService,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit() {
    this.platformType = this.platformCheckService.getPlatform();
    this.versionCheckService.checkVersion();
    
    try {
      // Ініціалізація мови буде автоматично перевіряти мову пристрою
      await this.translateService.loadSavedLanguage();
      console.log('Translations initialized successfully');
      
      // Додаткова перевірка що переклади завантажилися
      setTimeout(() => {
        console.log('Current language:', this.translateService.currentLanguage);
        console.log('Sample translation:', this.translateService.instant('COMMON.WELCOME'));
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
    }

    // Ініціалізуємо Firebase
    try {
      console.log('Initializing Firebase in app component...');
      await this.firebaseService.initializeFirebase();
      console.log('Firebase initialized successfully in app component');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }

    // Очищаємо застарілі дані при запуску
    await this.cleanupStaleData();
  }

  private async cleanupStaleData() {
    try {
      console.log('Cleaning up stale data...');
      
      // Перевіряємо дані користувача
      const { value: userData } = await Preferences.get({ key: 'userData' });
      if (userData) {
        const user = JSON.parse(userData);
        
        // Перевіряємо термін дії токена
        if (user.tokenExpiration) {
          const tokenExpiration = new Date(user.tokenExpiration);
          const now = new Date();
          console.log('Token expiration check in cleanup:', { tokenExpiration, now, isValid: tokenExpiration > now });
          
          if (tokenExpiration < now) {
            console.log('Token expired, cleaning up user data');
            await Preferences.remove({ key: 'userData' });
            await Preferences.remove({ key: 'authToken' });
            await Preferences.remove({ key: 'isFirstLogin' });
          }
        }
      }
      
      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Error during data cleanup:', error);
    }
  }
}
