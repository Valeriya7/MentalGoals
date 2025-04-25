import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private offlineToast: HTMLIonToastElement | null = null;

  constructor(
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  async showOfflineAlert() {
    if (this.offlineToast) {
      return;
    }

    this.offlineToast = await this.toastController.create({
      message: this.translate.instant('NOTIFICATIONS.OFFLINE_MODE'),
      duration: 0,
      position: 'bottom',
      color: 'warning',
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
          handler: () => {
            this.offlineToast = null;
          }
        }
      ]
    });

    await this.offlineToast.present();
  }

  async hideOfflineAlert() {
    if (this.offlineToast) {
      await this.offlineToast.dismiss();
      this.offlineToast = null;
    }
  }

  async showOnlineAlert() {
    const toast = await this.toastController.create({
      message: this.translate.instant('NOTIFICATIONS.ONLINE_MODE'),
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }
} 