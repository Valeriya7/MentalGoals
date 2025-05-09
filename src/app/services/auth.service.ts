import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Router } from '@angular/router';
import { appConfig } from '../config/app.config';
import { Capacitor } from '@capacitor/core';
import { StorageService } from './storage.service';
import { User } from '../interfaces/user.interface';
import { FirebaseService } from './firebase.service';
import { ChallengeService } from '../services/challenge.service';
import { ToastController } from '@ionic/angular';
import { ModalService } from '../services/modal.service';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential } from 'firebase/auth';
import { getGoogleConfig } from '../config/firebase.config';
import { doc, setDoc } from 'firebase/firestore';

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
        const googleConfig = getGoogleConfig();

        await GoogleAuth.initialize({
          clientId: googleConfig.clientId,
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
          forceCodeForRefreshToken: true
        });

        console.log('Google Auth initialized successfully with clientId:', googleConfig.clientId);
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

  async getCurrentUser(): Promise<User | null> {
    try {
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value) as User;
        console.log('Loaded user data:', userData);

        if (!userData.idToken) {
          console.log('No valid token found');
          this.currentUserSubject.next(null);
          return null;
        }

        const tokenExpiration = new Date(userData.tokenExpiration);
        if (tokenExpiration < new Date()) {
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
      console.log('Starting handleSuccessfulLogin with user data:', user);

      let userData: User;

      if (Capacitor.isNativePlatform()) {
        if (!user.authentication || !user.authentication?.idToken) {
          throw new Error('Invalid user data: missing token information');
        }

        userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.givenName || '',
          photoURL: user.imageUrl || '',
          idToken: user.authentication.idToken,
          tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString() // Токен дійсний 1 годину
        };
        console.log('Native platform user data:', userData);
      } else {
        if (!user.authentication || !user.authentication?.idToken) {
          throw new Error('Invalid user data: missing token information');
        }

        userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.givenName || '',
          photoURL: user.imageUrl || '',
          idToken: user.authentication.idToken,
          tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString() // Токен дійсний 1 годину
        };
        console.log('Web platform user data:', userData);
      }

      console.log('Processed user data for storage:', userData);

      // Перевіряємо, чи це перший вхід користувача
      const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
      if (!isFirstLogin) {
        console.log('First login detected, setting up initial data...');
        await Preferences.set({ key: 'isFirstLogin', value: 'true' });

        try {
          await this.challengeService.deactivateAllChallenges();
          console.log('All challenges deactivated for first login');
        } catch (error) {
          console.error('Error deactivating challenges:', error);
        }
      }

      // Зберігаємо дані користувача
      await Preferences.set({
        key: 'userData',
        value: JSON.stringify(userData)
      });
      console.log('User data saved to Preferences');

      // Оновлюємо токен в конфігурації
      appConfig.ID_TOKEN = userData.idToken;
      console.log('App config token updated');

      // Оновлюємо стан користувача
      this.currentUserSubject.next(userData);
      console.log('User state updated');

      // Зберігаємо дані в Firebase
      try {
        const userRef = doc(this.firebaseService.getFirestore(), 'users', userData.id);
        await setDoc(userRef, {
          ...userData,
          lastLogin: new Date().toISOString()
        }, { merge: true });
        console.log('User data saved to Firebase');
      } catch (error) {
        console.error('Error saving user data to Firebase:', error);
      }

      // Перенаправляємо на домашню сторінку
      console.log('Navigating to home page...');
      
      if (this.platform.is('ios')) {
        console.log('iOS platform detected, using delayed navigation');
        setTimeout(async () => {
          try {
            await this.router.navigate(['/tabs/home'], { 
              replaceUrl: true,
              skipLocationChange: false
            });
            console.log('Navigation completed');
          } catch (error) {
            console.error('Navigation error:', error);
            // Спробуємо альтернативний метод навігації
            window.location.href = '/tabs/home';
          }
        }, 1000); // Збільшуємо затримку для iOS
      } else {
        try {
          await this.router.navigate(['/tabs/home'], { 
            replaceUrl: true,
            skipLocationChange: false
          });
          console.log('Navigation completed');
        } catch (error) {
          console.error('Navigation error:', error);
          window.location.href = '/tabs/home';
        }
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

  async signInWithGoogle(): Promise<User | null> {
    try {
      console.log('Starting Google sign in process...');

      const result = await this.firebaseService.signInWithGoogle();
      console.log('Firebase sign in result:', result);

      if (!result || !result.user) {
        console.error('No user data in sign in result:', result);
        throw new Error('No user data in sign in result');
      }

      console.log('Getting user ID token...');
      const idToken = await result.user.getIdToken();
      console.log('ID token received:', idToken.substring(0, 10) + '...');

      const userData: User = {
        id: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        idToken: idToken,
        tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString() // Токен дійсний 1 годину
      };

      console.log('User data prepared:', userData);

      // Зберігаємо дані користувача
      await Preferences.set({
        key: 'userData',
        value: JSON.stringify(userData)
      });
      console.log('User data saved to preferences');

      // Оновлюємо токен в конфігурації
      appConfig.ID_TOKEN = userData.idToken;
      console.log('App config token updated');

      // Оновлюємо стан користувача
      this.currentUserSubject.next(userData);
      console.log('User state updated');

      // Перенаправляємо на домашню сторінку
      console.log('Navigating to home page...');
      await this.router.navigate(['/tabs/home'], { replaceUrl: true });
      console.log('Navigation complete');

      return userData;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      let errorMessage = 'Failed to sign in with Google';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Detailed error:', errorMessage);
      }

      await this.showErrorToast(errorMessage);
      return null;
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: this.translate.instant(message),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
