import { Component } from '@angular/core';
import { PlatformCheckService } from 'src/app/services/platform-check.service';
import { VersionCheckService } from './services/version-check.service'; // Імпортуємо наш сервіс

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  platformType: string = '';

  constructor(
    private platformCheckService: PlatformCheckService,
    private versionCheckService: VersionCheckService
  ) {
  }

  ngOnInit() {
    this.platformType = this.platformCheckService.getPlatform();
    console.log('Current platform:', this.platformType);
    this.versionCheckService.checkVersion(); // Перевірка версії при запуску додатку
  }
}
