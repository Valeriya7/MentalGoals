import { Component } from '@angular/core';
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
  imports: [IonicModule]
})
export class AppComponent {
  platformType: string = '';

  constructor(
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    this.platformType = this.platformCheckService.getPlatform();
    this.versionCheckService.checkVersion();
    
    try {
      await this.translateService.setLanguage('en');
      console.log('Translations initialized');
    } catch (error) {
      console.error('Failed to initialize translations:', error);
    }
  }
}
