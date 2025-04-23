import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Router } from '@angular/router';
import { appConfig } from '../config/app.config';
import { Capacitor } from '@capacitor/core';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private storageService: StorageService,
    private firebaseService: FirebaseService
  ) {
    this.loadStoredUser();
    this.initializeGoogleAuth();
  }

  private async initializeGoogleAuth() {
    try {
      let clientId = appConfig.GOOGLE_CLIENT_ID;
      if (Capacitor.getPlatform() === 'ios') {
        clientId = '629190984804-oqit9rd3t8rb7jucei1lq8g236c1bpjg.apps.googleusercontent.com';
      } else if (Capacitor.getPlatform() === 'android') {
        clientId = '629190984804-hihuo9k8tj6bn2f3pm3b3omgfiqdualp.apps.googleusercontent.com';
      }

      await GoogleAuth.initialize({
        clientId: clientId,
        scopes: ['profile', 'email'],
        forceCodeForRefreshToken: true
      });
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
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
        const userData = JSON.parse(value);
        this.currentUserSubject.next(userData);
        return userData;
      }
      this.currentUserSubject.next(null);
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      this.currentUserSubject.next(null);
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

      console.log('User data to be saved:', userData);

      // Перевіряємо і створюємо користувача в Firebase Authentication
      try {
        // Використовуємо idToken як пароль для Firebase Authentication
        const password = user.idToken;
        
        // Спочатку пробуємо увійти
        try {
          const firebaseUser = await this.firebaseService.login(user.email, password);
          console.log('Firebase user logged in:', firebaseUser);
        } catch (loginError: any) {
          // Якщо не вдалося увійти, створюємо нового користувача
          if (loginError.code === 'auth/user-not-found') {
            const firebaseUser = await this.firebaseService.register(user.email, password);
            console.log('Firebase user created:', firebaseUser);
          } else {
            console.log('Firebase login error:', loginError);
          }
        }
      } catch (error) {
        console.log('Firebase authentication error:', error);
      }

      // Зберігаємо дані користувача
      await Preferences.set({
        key: 'userData',
        value: JSON.stringify(userData)
      });

      // Оновлюємо токен в конфігурації
      appConfig.ID_TOKEN = user.authentication.idToken;

      // Оновлюємо стан користувача
      this.currentUserSubject.next(userData);

      // Зберігаємо дані в Firebase
      try {
        await this.storageService.set('users', userData);
        console.log('User data saved to Firebase:', userData);
        await this.router.navigate(['/tabs/home']);
      } catch (error) {
        console.error('Error saving user data to Firebase:', error);
      }

      return userData;
    } catch (error) {
      console.error('Error handling successful login:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      // Очищаємо дані користувача
      await Preferences.remove({ key: 'userData' });
      await Preferences.remove({ key: 'isFirstLogin' });
      
      // Очищаємо токен в конфігурації
      appConfig.ID_TOKEN = null;
      
      // Оновлюємо стан користувача
      this.currentUserSubject.next(null);

      // Виходимо з Google Auth
      await GoogleAuth.signOut();

      // Перенаправляємо на сторінку автентифікації
      await this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error signing out:', error);
      // Навіть якщо виникла помилка, все одно очищаємо дані
      await Preferences.remove({ key: 'userData' });
      await Preferences.remove({ key: 'isFirstLogin' });
      appConfig.ID_TOKEN = null;
      this.currentUserSubject.next(null);
      await this.router.navigate(['/auth']);
    }
  }

  async updateUserPoints(points: number): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      const currentPoints = user.points || 0;
      const newPoints = currentPoints + points;

      // Оновлюємо бали користувача в Preferences
      await Preferences.set({ key: 'userPoints', value: newPoints.toString() });

      // Оновлюємо бали в поточному об'єкті користувача
      user.points = newPoints;
      this.currentUserSubject.next(user);

      // Оновлюємо бали в базі даних
      await this.storageService.set('userPoints', newPoints);
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  }
}
