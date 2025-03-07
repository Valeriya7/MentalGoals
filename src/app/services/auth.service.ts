import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Router } from '@angular/router';
import { appConfig } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.loadStoredUser();
  }

  private async loadStoredUser() {
    try {
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value);
        this.currentUserSubject.next(userData);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async handleSuccessfulLogin(user: any) {
    try {
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        photoURL: user.imageUrl,
        accessToken: user.authentication.accessToken,
        idToken: user.authentication.idToken
      };

      // Зберігаємо дані користувача
      await Preferences.set({
        key: 'userData',
        value: JSON.stringify(userData)
      });

      // Оновлюємо токен в конфігурації
      appConfig.ID_TOKEN = user.authentication.idToken;

      // Оновлюємо стан користувача
      this.currentUserSubject.next(userData);

      return userData;
    } catch (error) {
      console.error('Error handling successful login:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await GoogleAuth.signOut();
      await Preferences.remove({ key: 'userData' });
      this.currentUserSubject.next(null);
      await this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}
