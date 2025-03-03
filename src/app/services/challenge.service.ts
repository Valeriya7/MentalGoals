import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private loadingElement: HTMLIonLoadingElement | null = null;
  private activeChallenge = new BehaviorSubject<string | null>(null);

  constructor(
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async startNewChallenge(type: string): Promise<boolean> {
    try {
      this.loadingElement = await this.loadingController.create({
        message: 'Починаємо виклик...',
        spinner: 'circular'
      });
      
      await this.loadingElement.present();

      // Імітуємо асинхронну операцію
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.activeChallenge.next(type);

      if (this.loadingElement) {
        await this.loadingElement.dismiss();
        this.loadingElement = null;
      }

      await this.showSuccessToast(type);
      return true;

    } catch (error) {
      console.error('Помилка при старті виклику:', error);
      
      if (this.loadingElement) {
        await this.loadingElement.dismiss();
        this.loadingElement = null;
      }

      await this.showErrorToast();
      return false;
    }
  }

  private async showSuccessToast(type: string): Promise<void> {
    const toast = await this.toastController.create({
      message: `Виклик "${type}" успішно розпочато!`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  private async showErrorToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Не вдалося розпочати виклик. Спробуйте ще раз.',
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  getActiveChallenge() {
    return this.activeChallenge.asObservable();
  }
} 