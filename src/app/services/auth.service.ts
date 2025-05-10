import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Router } from '@angular/router';
import { appConfig } from '../config/app.config';
import { Capacitor } from '@capacitor/core';
import { StorageService } from './storage.service';
import { User as AppUser } from '../interfaces/user.interface';
import { FirebaseService } from './firebase.service';
import { ChallengeService } from '../services/challenge.service';
import { ToastController, NavController, Platform } from '@ionic/angular';
import { ModalService } from '../services/modal.service';
import { TranslateService } from '@ngx-translate/core';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, User as FirebaseUser } from 'firebase/auth';
import { getGoogleConfig } from '../config/firebase.config';
import { doc, setDoc } from 'firebase/firestore';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private storageService: StorageService,
    private firebaseService: FirebaseService,
    private challengeService: ChallengeService,
    private toastController: ToastController,
    private modalService: ModalService,
    private platform: Platform,
    private translate: TranslateService,
    private navCtrl: NavController
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

  async getCurrentUser(): Promise<AppUser | null> {
    try {
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value) as AppUser;
        console.log('Loaded user data:', userData);

        // Перевіряємо токен
        const { value: token } = await Preferences.get({ key: 'authToken' });
        if (!token) {
          console.log('No valid token found');
          this.currentUserSubject.next(null);
          return null;
        }

        // Перевіряємо термін дії токена
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

  private async navigateToHome() {
    console.log('Starting navigation to home...');

    if (this.platform.is('ios')) {
      console.log('iOS platform detected, using NavController navigation');

      // Додаємо затримку для iOS
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        // Використовуємо NavController з анімацією
        await this.navCtrl.navigateRoot('/tabs/home', {
          animated: true,
          animationDirection: 'forward'
        });
        console.log('Navigation through NavController completed');
      } catch (navError) {
        console.error('NavController navigation failed:', navError);

        // Якщо NavController не спрацював, використовуємо window.location
        const baseUrl = window.location.origin;
        window.location.href = `${baseUrl}/tabs/home`;
      }
    } else {
      console.log('Android platform detected');

      // Додаємо затримку для Android
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        // Спочатку пробуємо через NavController
        await this.navCtrl.navigateRoot('/tabs/home', {
          animated: true,
          animationDirection: 'forward'
        });
        console.log('Navigation through NavController completed');
      } catch (navError) {
        console.error('NavController navigation failed:', navError);

        try {
          // Якщо NavController не спрацював, пробуємо через Router з затримкою
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.router.navigate(['/tabs/home'], {
            replaceUrl: true,
            skipLocationChange: false
          });
          console.log('Navigation through Router completed');
        } catch (routerError) {
          console.error('Router navigation failed:', routerError);

          // Якщо і Router не спрацював, використовуємо window.location
          window.location.href = '/tabs/home';
        }
      }
    }
  }

  async handleSuccessfulLogin(user: any) {
    console.log('!!! handleSuccessfulLogin:', user);

    try {
      let userData: AppUser;

      if (Capacitor.isNativePlatform()) {
        console.log('Native platform detected');

        // Перевіряємо наявність токена
        if (!user.authentication?.idToken && !user.idToken) {
          console.error('No token found in user data:', user);
          throw new Error('Invalid user data: missing token information');
        }

        // Створюємо об'єкт користувача
        userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.givenName || '',
          photoURL: user.imageUrl || '',
          idToken: user.authentication?.idToken || user.idToken,
          tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString()
        };
        console.log('Created user data for native platform:', userData);
      } else {
        console.log('Web platform detected');

        if (!user.authentication?.idToken && !user.idToken) {
          console.error('No token found in user data:', user);
          throw new Error('Invalid user data: missing token information');
        }

        userData = {
          id: user.id,
          email: user.email,
          name: user.name || user.givenName || '',
          photoURL: user.imageUrl || '',
          idToken: user.authentication?.idToken || user.idToken,
          tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString()
        };
        console.log('Created user data for web platform:', userData);
      }

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

      // Зберігаємо токен окремо
      await Preferences.set({
        key: 'authToken',
        value: userData.idToken
      });
      console.log('Auth token saved to Preferences');

      // Оновлюємо токен в конфігурації
      appConfig.ID_TOKEN = userData.idToken;
      console.log('App config token updated');

      // Оновлюємо стан користувача
      this.currentUserSubject.next(userData);
      console.log('User state updated');

      // Зберігаємо дані в Firebase
      try {
        //console.log('Platform:', Capacitor.getPlatform());
        console.log('userData.id :', userData.id);
        //if (Capacitor.getPlatform() == 'web') {
          const userRef = doc(this.firebaseService.getFirestore(), 'users', userData.id);
          await setDoc(userRef, {
            ...userData,
            lastLogin: new Date().toISOString()
          }, {merge: true});
          console.log('User data saved to Firebase');
        //}
      } catch (error) {
        console.error('Error saving user data to Firebase:', error);
      }

      // Перенаправляємо на домашню сторінку
      console.log('Starting navigation to home page...');
      await this.navigateToHome();

      return userData;
    } catch (error) {
      console.error('Error in handleSuccessfulLogin:', error);
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

  async signInWithGoogle(): Promise<AppUser | null> {
    try {
      console.log('Starting Google sign in process...');

      const firebaseUser = await this.firebaseService.signInWithGoogle();
      console.log('Firebase sign in result:', firebaseUser);

      if (!firebaseUser) {
        console.error('No user data in sign in result');
        throw new Error('No user data in sign in result');
      }

      // Отримуємо токен безпосередньо з Firebase Auth
      const idToken = await firebaseUser.getIdToken();
      console.log('ID token received:', idToken.substring(0, 10) + '...');

      const userData: AppUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        idToken: idToken,
        tokenExpiration: new Date(Date.now() + 3600 * 1000).toISOString()
      };

      console.log('User data prepared:', userData);

      // Зберігаємо дані користувача
      await Preferences.set({
        key: 'userData',
        value: JSON.stringify(userData)
      });
      console.log('User data saved to preferences');

      // Зберігаємо токен окремо
      await Preferences.set({
        key: 'authToken',
        value: idToken
      });
      console.log('Auth token saved to preferences');

      // Оновлюємо токен в конфігурації
      appConfig.ID_TOKEN = idToken;
      console.log('App config token updated');

      // Оновлюємо стан користувача
      this.currentUserSubject.next(userData);
      console.log('User state updated');

      // Перенаправляємо на домашню сторінку
      console.log('Starting navigation to home page...');
      await this.navigateToHome();

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
