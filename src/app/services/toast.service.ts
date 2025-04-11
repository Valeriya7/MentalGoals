import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' | 'medium' = 'medium',
    duration: number = 2000
  ) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color
    });

    await toast.present();
  }
} 