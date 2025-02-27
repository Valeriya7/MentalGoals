import { Injectable } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { APP_CONFIG } from '../../../src/app.config';

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {
  constructor(
    private platform: Platform,
    private alertController: AlertController
  ) {}

  async checkVersion() {
    const currentVersion = APP_CONFIG.VERSION;
    const latestVersion = await this.getLatestVersionFromServer(); // Заміни на свою логіку для отримання актуальної версії

    if (currentVersion !== latestVersion) {
      await this.showUpdateAlert();
    }
  }

  private async getLatestVersionFromServer(): Promise<string> {
    // Тут ви можете звертатися до API для отримання останньої версії
    // Наприклад, відправити запит до серверу, щоб отримати останню версію
    // Це лише приклад, реальна реалізація залежить від вашої архітектури
    return '0.0.1'; // Це фіктивна версія для прикладу
  }

  private async showUpdateAlert() {
    const alert = await this.alertController.create({
      header: 'Оновлення доступне!',
      message: 'Будь ласка, оновіть додаток до останньої версії.',
      buttons: [
        {
          text: 'Оновити',
          handler: () => {
            this.redirectToAppStore();
          },
        },
      ],
    });

    await alert.present();
  }

  private redirectToAppStore() {
    // Для iOS і Android редирект до відповідних магазинів
    if (this.platform.is('ios')) {
      window.location.href = 'https://apps.apple.com/app/your-app-id';
    } else if (this.platform.is('android')) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.yourapp';
    }
  }
}
