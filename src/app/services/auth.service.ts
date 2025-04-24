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
import { ChallengeService } from '../services/challenge.service';
import { ToastController } from '@ionic/angular';
import { ModalService } from '../services/modal.service';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private storageService: StorageService,
    private firebaseService: FirebaseService,
    private challengeService: ChallengeService,
    private toastController: ToastController,
    private modalService: ModalService,
    private platform: Platform,
    private translate: TranslateService
  ) {
    this.loadStoredUser();
    this.initializeGoogleAuth();
  }

  private async initializeGoogleAuth() {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.initialize({
          clientId: appConfig.GOOGLE_CLIENT_ID,
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
          forceCodeForRefreshToken: true
        });
      }
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
        
        // Перевіряємо наявність та валідність токена
        if (!userData.idToken) {
          console.log('No valid token found');
          this.currentUserSubject.next(null);
          return null;
        }

        // Перевіряємо, чи не минув час дії токена
        const tokenExpiration = userData.tokenExpiration;
        if (tokenExpiration && new Date(tokenExpiration) < new Date()) {
          console.log('Token has expired');
          this.currentUserSubject.next(null);
          return null;
        }

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
        idToken: user.authentication.idToken,
        tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString() // Токен діє 1 годину
      };

      console.log('User data to be saved:', userData);

      // Автентифікація через Google в Firebase
      try {
        const firebaseUser = await this.firebaseService.signInWithGoogle();
        console.log('Firebase user authenticated:', firebaseUser);
      } catch (error) {
        console.log('Firebase authentication error:', error);
      }

      // Перевіряємо, чи це перший вхід користувача
      const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
      if (!isFirstLogin) {
        // Якщо це перший вхід, встановлюємо прапорець
        await Preferences.set({ key: 'isFirstLogin', value: 'true' });
        
        // Очищаємо всі активні челенджі
        try {
          await this.challengeService.deactivateAllChallenges();
        } catch (error) {
          console.error('Error deactivating challenges:', error);
        }
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
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }

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

  async signInWithGoogle() {
    try {
      const googleUser = await GoogleAuth.signIn();
      if (googleUser) {
        const credential = await this.firebaseService.getGoogleCredential(googleUser.authentication.idToken);
        const userCredential = await this.firebaseService.signInWithCredential(credential);
        await this.handleSuccessfulLogin(userCredential.user);
        return userCredential.user;
      }
      return null;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }
}
