import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlatformCheckService } from './services/platform-check.service';
import { VersionCheckService } from './services/version-check.service';
import './utils/icons'; // Імпортуємо централізовану реєстрацію іконок
import { TranslateService } from './services/translate.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
  standalone: true,
  imports: [IonicModule, TranslateModule, CommonModule, RouterModule]
})
export class AppComponent implements OnInit {
  platformType: string = '';

  constructor(
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    try {
      // Спочатку ініціалізуємо базові сервіси
      this.platformType = this.platformCheckService.getPlatform();
      this.versionCheckService.checkVersion();
      
      // Даємо час на ініціалізацію TranslateModule
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Тепер завантажуємо переклади
      await this.translateService.loadSavedLanguage();
      console.log('Translations initialized successfully');
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }
}
