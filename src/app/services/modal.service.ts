import { Injectable } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private loadingElement: HTMLIonLoadingElement | null = null;
  private currentModal: HTMLIonModalElement | null = null;

  constructor(
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {}

  async showLoading(message: string = 'Please wait...'): Promise<void> {
    try {
      // Закриваємо попереднє вікно завантаження, якщо воно є
      await this.hideLoading();

      this.loadingElement = await this.loadingController.create({
        message,
        cssClass: 'custom-loading',
        spinner: 'circular',
        backdropDismiss: false,
        showBackdrop: true,
        // Налаштування для доступності
        htmlAttributes: {
          'role': 'dialog',
          'aria-modal': 'true',
          'aria-label': message
        }
      });

      await this.loadingElement.present();
    } catch (error) {
      console.error('Error showing loading:', error);
    }
  }

  async hideLoading(): Promise<void> {
    if (this.loadingElement) {
      try {
        await this.loadingElement.dismiss();
        this.loadingElement = null;
      } catch (error) {
        console.error('Error dismissing loading:', error);
      }
    }
  }

  async createModal(component: any, props?: any, cssClass?: string): Promise<HTMLIonModalElement> {
    try {
      // Закриваємо попереднє модальне вікно, якщо воно є
      await this.dismissModal();

      this.currentModal = await this.modalController.create({
        component,
        componentProps: props,
        cssClass: `accessible-modal ${cssClass || ''}`,
        backdropDismiss: true,
        keyboardClose: true,
        presentingElement: await this.modalController.getTop(),
        // Налаштування для доступності
        htmlAttributes: {
          'role': 'dialog',
          'aria-modal': 'true'
        }
      });

      return this.currentModal;
    } catch (error) {
      console.error('Error creating modal:', error);
      throw error;
    }
  }

  async dismissModal(): Promise<boolean> {
    try {
      const topModal = await this.modalController.getTop();
      if (topModal) {
        await topModal.dismiss();
        this.currentModal = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error dismissing modal:', error);
      return false;
    }
  }
} 