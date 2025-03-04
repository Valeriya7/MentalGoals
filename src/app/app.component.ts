import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlatformCheckService } from './services/platform-check.service';
import { VersionCheckService } from './services/version-check.service';
import './utils/icons'; // Імпортуємо централізовану реєстрацію іконок
import { TranslateService } from './services/translate.service';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, TranslatePipe]
})
export class AppComponent implements OnInit {
  platformType: string = '';

  constructor(
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.platformType = this.platformCheckService.getPlatform();
    this.versionCheckService.checkVersion();
  }
}
