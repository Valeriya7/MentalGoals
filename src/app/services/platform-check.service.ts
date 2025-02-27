import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
@Injectable({
  providedIn: 'root'
})
export class PlatformCheckService {

  private currentPlatform: string = 'web'; // За замовчуванням Web

  constructor(private platform: Platform) {
    this.setPlatform();
  }
  private setPlatform() {
    if (this.platform.is('ios')) {
      this.currentPlatform = 'ios';
    } else if (this.platform.is('android')) {
      this.currentPlatform = 'android';
    } else if (this.platform.is('mobileweb')) {
      this.currentPlatform = 'mobileweb';
    } else {
      this.currentPlatform = 'web';
    }
  }

  // Метод для отримання поточної платформи
  getPlatform(): string {
    return this.currentPlatform;
  }
}
