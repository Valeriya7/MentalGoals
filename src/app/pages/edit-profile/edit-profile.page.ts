import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, IonBackButton } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataService } from "../../services/data.service";

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule, RouterModule]
})
export class EditProfilePage implements OnInit {
  userData = {
    name: '',
    email: '',
    phone: '',
    bio: ''
  };
  originalUserData = { ...this.userData };
  isSaving = false;

  constructor(
    private router: Router,
    private dataService: DataService,
    private toastController: ToastController,
    private translateService: TranslateService
  ) {
    addIcons({
      'save-outline': saveOutline
    });
  }

  async ngOnInit() {
    console.log('ngOnInit!!!');
    try {
      await this.loadUserData();
      this.originalUserData = { ...this.userData };
    } catch (error) {
      console.error('Error initializing edit profile page:', error);
      await this.showToast('PROFILE.LOAD_ERROR', 'danger');
    }
  }

  private async loadUserData() {
    try {
      // Спочатку пробуємо завантажити з Firebase
      const firebaseData = await this.dataService.getUserData();
      if (firebaseData && typeof firebaseData === 'object') {
        this.userData = { ...this.userData, ...firebaseData };
      } else {
        // Якщо в Firebase немає даних, завантажуємо з Preferences
        const { value: name } = await Preferences.get({ key: 'name' });
        const { value: email } = await Preferences.get({ key: 'email' });
        const { value: phone } = await Preferences.get({ key: 'phone' });
        const { value: bio } = await Preferences.get({ key: 'bio' });

        if (name) this.userData.name = name;
        if (email) this.userData.email = email;
        if (phone) this.userData.phone = phone;
        if (bio) this.userData.bio = bio;
      }
      this.originalUserData = { ...this.userData };
    } catch (error) {
      console.error('Error loading user data:', error);
      await this.showToast('PROFILE.LOAD_ERROR', 'danger');
      throw error; // Передаємо помилку далі
    }
  }

  private async showToast(messageKey: string, color: 'success' | 'danger' | 'warning' = 'success') {
    try {
      const toast = await this.toastController.create({
        message: this.translateService.instant(messageKey),
        duration: 2000,
        color: color,
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }

  private hasChanges(): boolean {
    return JSON.stringify(this.userData) !== JSON.stringify(this.originalUserData);
  }

  private validateData(): boolean {
    if (!this.userData.name?.trim()) {
      this.showToast('PROFILE.NAME_REQUIRED', 'warning');
      return false;
    }
    if (this.userData.email && !this.isValidEmail(this.userData.email)) {
      this.showToast('PROFILE.INVALID_EMAIL', 'warning');
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async saveProfile() {
    if (!this.hasChanges()) {
      await this.showToast('PROFILE.NO_CHANGES', 'warning');
      try {
        await this.router.navigate(['/tabs/profile']);
      } catch (error) {
        console.error('Error navigating back to profile:', error);
      }
      return;
    }

    if (!this.validateData()) {
      return;
    }

    this.isSaving = true;

    try {
      // Зберігаємо в Firebase
      await this.dataService.saveUserData(this.userData);

      // Також зберігаємо локально для швидкого доступу
      await Promise.all([
        Preferences.set({ key: 'name', value: this.userData.name }),
        Preferences.set({ key: 'email', value: this.userData.email || '' }),
        Preferences.set({ key: 'phone', value: this.userData.phone || '' }),
        Preferences.set({ key: 'bio', value: this.userData.bio || '' })
      ]);

      this.originalUserData = { ...this.userData };
      await this.showToast('PROFILE.SAVE_SUCCESS');
      try {
        await this.router.navigate(['/tabs/profile']);
      } catch (error) {
        console.error('Error navigating back to profile:', error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      await this.showToast('PROFILE.SAVE_ERROR', 'danger');
    } finally {
      this.isSaving = false;
    }
  }
}
