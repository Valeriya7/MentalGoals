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
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential, User as FirebaseUser, getAuth } from 'firebase/auth';
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
  private auth: any;
  private googleAuthInitialized = false;

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
    if (this.googleAuthInitialized) {
      console.log('Google Auth already initialized');
      return;
    }

    try {
      console.log('Initializing Firebase Auth...');
      const config = getGoogleConfig();
      console.log('Google Config:', config);

      if (Capacitor.isNativePlatform()) {
        console.log('Native platform detected, initializing Firebase Auth');
        this.auth = getAuth();
        console.log('Firebase Auth instance created');
        
        // Перевіряємо, чи Firebase ініціалізований
        if (!this.auth) {
          console.error('Firebase Auth not initialized properly');
          throw new Error('Firebase Auth not initialized');
        }
        
        this.googleAuthInitialized = true;
        console.log('Firebase Auth initialized successfully for native platform');
      } else {
        // Для веб-версії використовуємо Firebase Auth
        this.auth = getAuth();
        console.log('Firebase Auth instance created for web');
        
        // Перевіряємо, чи Firebase ініціалізований
        if (!this.auth) {
          console.error('Firebase Auth not initialized properly for web');
          throw new Error('Firebase Auth not initialized');
        }
        
        this.googleAuthInitialized = true;
        console.log('Firebase Auth initialized successfully for web platform');
      }

      // Додаємо слухача стану автентифікації
      this.auth.onAuthStateChanged((user: FirebaseUser | null) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
        if (user) {
          console.log('User details:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      });
    } catch (error) {
      console.error('Error initializing Firebase Auth:', error);
      this.googleAuthInitialized = false;
      await this.showErrorToast('Помилка ініціалізації Firebase Auth');
    }
  }

  private async loadStoredUser() {
    try {
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value) as AppUser;
        console.log('Loading stored user data:', userData);
        
        // Перевіряємо токен
        const { value: token } = await Preferences.get({ key: 'authToken' });
        if (!token) {
          console.log('No valid token found, clearing user data');
          this.currentUserSubject.next(null);
          return;
        }

        // Перевіряємо термін дії токена
        if (userData.tokenExpiration) {
          const tokenExpiration = new Date(userData.tokenExpiration);
          const now = new Date();
          console.log('Token expiration check in loadStoredUser:', { tokenExpiration, now, isValid: tokenExpiration > now });
          
          if (tokenExpiration < now) {
            console.log('Token has expired, clearing user data');
            await Preferences.remove({ key: 'userData' });
            await Preferences.remove({ key: 'authToken' });
            this.currentUserSubject.next(null);
            return;
          }
        }

        this.currentUserSubject.next(userData);
        console.log('Stored user data loaded successfully');
      } else {
        console.log('No stored user data found');
        this.currentUserSubject.next(null);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      this.currentUserSubject.next(null);
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
        if (userData.tokenExpiration) {
          const tokenExpiration = new Date(userData.tokenExpiration);
          const now = new Date();
          console.log('Token expiration check:', { tokenExpiration, now, isValid: tokenExpiration > now });
          
          if (tokenExpiration < now) {
            console.log('Token has expired, clearing user data');
            // Очищаємо застарілі дані
            await Preferences.remove({ key: 'userData' });
            await Preferences.remove({ key: 'authToken' });
            this.currentUserSubject.next(null);
            return null;
          }
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
    try {
      console.log('=== AuthService: navigateToHome START ===');
      console.log('Starting navigation after login...');

      // Додаємо затримку для стабільності
      console.log('Waiting 1 second before navigation...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Перевіряємо, чи це перший вхід користувача
      const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
      console.log('Is first login:', isFirstLogin);
      
      let targetRoute = '/tabs/home';
      if (isFirstLogin === 'true' || isFirstLogin === null) {
        // Якщо це перший вхід, перенаправляємо на сторінку питань
        targetRoute = '/questions';
        console.log('First login detected, navigating to questions page');
      } else {
        console.log('Not first login, navigating to home page');
      }

      console.log('Target route:', targetRoute);
      console.log('Platform:', this.platform.platforms());

      if (this.platform.is('ios')) {
        console.log('iOS platform detected, using NavController navigation');

        try {
          // Використовуємо NavController з анімацією
          console.log('Attempting NavController navigation to:', targetRoute);
          await this.navCtrl.navigateRoot(targetRoute, {
            animated: true,
            animationDirection: 'forward'
          });
          console.log('Navigation through NavController completed to:', targetRoute);
        } catch (navError) {
          console.error('NavController navigation failed:', navError);

          // Якщо NavController не спрацював, використовуємо window.location
          console.log('Falling back to window.location navigation');
          const baseUrl = window.location.origin;
          window.location.href = `${baseUrl}${targetRoute}`;
        }
      } else {
        console.log('Android platform detected');

        try {
          // Спочатку пробуємо через NavController
          console.log('Attempting NavController navigation to:', targetRoute);
          await this.navCtrl.navigateRoot(targetRoute, {
            animated: true,
            animationDirection: 'forward'
          });
          console.log('Navigation through NavController completed to:', targetRoute);
        } catch (navError) {
          console.error('NavController navigation failed:', navError);

          try {
            // Якщо NavController не спрацював, пробуємо через Router з затримкою
            console.log('Falling back to Router navigation');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.router.navigate([targetRoute], {
              replaceUrl: true,
              skipLocationChange: false
            });
            console.log('Navigation through Router completed to:', targetRoute);
          } catch (routerError) {
            console.error('Router navigation failed:', routerError);

            // Якщо і Router не спрацював, використовуємо window.location
            console.log('Falling back to window.location navigation');
            window.location.href = targetRoute;
          }
        }
      }
      
      console.log('=== AuthService: navigateToHome END ===');
    } catch (error) {
      console.error('Navigation error:', error);
      // Якщо всі методи навігації не спрацювали, використовуємо window.location
      console.log('Final fallback to window.location');
      window.location.href = '/tabs/home';
    }
  }

  async handleSuccessfulLogin(user: any) {
    try {
      console.log('=== AuthService: handleSuccessfulLogin START ===');
      console.log('Handling successful login for user:', user);
      console.log('User object keys:', Object.keys(user));
      console.log('User id:', user.id);
      console.log('User email:', user.email);
      console.log('User idToken length:', user.idToken ? user.idToken.length : 'undefined');
      
      // Перевіряємо обов'язкові поля
      if (!user.id || user.id === '' || !user.idToken || user.idToken === '') {
        console.error('Missing required user data:', user);
        throw new Error('Недостатньо даних користувача');
      }
      
      const userData: AppUser = {
        id: user.id || '',
        email: user.email || '',
        name: user.name || user.displayName || 'Користувач',
        photoURL: user.imageUrl || user.photoURL || '',
        points: 0,
        idToken: user.idToken,
        tokenExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 години
      };
      console.log('Processed user data:', userData);
      
      console.log('Saving user data to storage...');
      // Зберігаємо дані користувача
      await this.storageService.set('user', userData);
      await Preferences.set({ key: 'userData', value: JSON.stringify(userData) });
      await Preferences.set({ key: 'authToken', value: userData.idToken });
      console.log('User data saved successfully');
      
      // Перевіряємо, чи це перший вхід
      const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
      console.log('Current isFirstLogin value:', isFirstLogin);
      if (isFirstLogin === null) {
        console.log('First login detected, setting isFirstLogin flag to true');
        await Preferences.set({ key: 'isFirstLogin', value: 'true' });
      } else {
        console.log('Not first login, isFirstLogin value:', isFirstLogin);
      }
      
      // Оновлюємо поточного користувача
      this.currentUserSubject.next(userData);
      console.log('Current user subject updated');
      
      // Показуємо повідомлення про успішний вхід
      await this.toastController.create({
        message: 'Успішний вхід',
        duration: 3000,
        position: 'bottom',
        color: 'success'
      }).then(toast => toast.present());
      
      console.log('Login process completed successfully');
      console.log('=== AuthService: handleSuccessfulLogin END ===');
      
      // Перенаправлення на домашню сторінку
      console.log('Starting navigation to home...');
      await this.navigateToHome();
      
    } catch (error) {
      console.error('Error in handleSuccessfulLogin:', error);
      await this.toastController.create({
        message: 'Помилка збереження даних користувача',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      }).then(toast => toast.present());
      throw error;
    }
  }

  async signOut() {
    try {
      console.log('Starting sign out process...');
      
      // Очищаємо дані користувача
      await Preferences.remove({ key: 'userData' });
      await Preferences.remove({ key: 'authToken' });
      await Preferences.remove({ key: 'isFirstLogin' });

      // Очищаємо токен в конфігурації
      appConfig.ID_TOKEN = null;

      // Оновлюємо стан користувача
      this.currentUserSubject.next(null);

      // Виходимо з Google Auth
      if (Capacitor.isNativePlatform()) {
        try {
          await GoogleAuth.signOut();
          console.log('Google Auth sign out successful');
        } catch (googleError) {
          console.error('Google Auth sign out error:', googleError);
        }
      }

      // Виходимо з Firebase Auth
      if (this.auth) {
        try {
          await this.auth.signOut();
          console.log('Firebase Auth sign out successful');
        } catch (firebaseError) {
          console.error('Firebase Auth sign out error:', firebaseError);
        }
      }

      console.log('Sign out completed, navigating to auth page');
      
      // Перенаправляємо на сторінку автентифікації
      await this.router.navigate(['/auth'], { replaceUrl: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Навіть якщо виникла помилка, все одно очищаємо дані
      await Preferences.remove({ key: 'userData' });
      await Preferences.remove({ key: 'authToken' });
      await Preferences.remove({ key: 'isFirstLogin' });
      appConfig.ID_TOKEN = null;
      this.currentUserSubject.next(null);
      await this.router.navigate(['/auth'], { replaceUrl: true });
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

  async signInWithGoogle(): Promise<void> {
    try {
      console.log('=== Starting Google sign in ===');
      console.log('Platform:', this.platform.platforms());
      console.log('Is native platform:', Capacitor.isNativePlatform());
      
      // Ініціалізуємо Google Auth тільки якщо ще не ініціалізовано
      if (!this.googleAuthInitialized) {
        console.log('Google Auth not initialized, initializing...');
        await this.initializeGoogleAuth();
      }
      
      console.log('Google Auth initialized, proceeding with sign in...');
      
      // Додаємо додаткову перевірку для Android
      if (Capacitor.isNativePlatform() && this.platform.is('android')) {
        console.log('Android platform detected, checking Google Play Services...');
        try {
          // Перевіряємо, чи доступні Google Play Services
          const { value: playServicesAvailable } = await Preferences.get({ key: 'googlePlayServicesAvailable' });
          console.log('Google Play Services available:', playServicesAvailable);
        } catch (playServicesError) {
          console.warn('Could not check Google Play Services:', playServicesError);
        }
      }
      
      console.log('Calling GoogleAuth.signIn()...');
      const user = await GoogleAuth.signIn();
      console.log('Google Auth sign in response:', user);
      
      if (user && user.authentication?.idToken) {
        console.log('Valid user data received, processing...');
        // Конвертуємо дані в правильний формат
        const userId = user.id || user.user?.id || user.authentication?.idToken;
        if (!userId || userId === '') {
          throw new Error('Не вдалося отримати ID користувача');
        }
        
        const userData = {
          id: userId,
          email: user.email || user.user?.email || '',
          name: user.name || user.user?.name || 'Користувач',
          imageUrl: user.imageUrl || user.user?.imageUrl || '',
          idToken: user.authentication.idToken
        };
        
        console.log('Processed user data:', userData);
        await this.handleSuccessfulLogin(userData);
        console.log('Google Auth login success');
      } else {
        console.error('Google Auth: No user data or ID token received from Google');
        console.error('User object:', user);
        console.error('Authentication object:', user?.authentication);
        throw new Error('Не вдалося отримати дані користувача або токен автентифікації');
      }
    } catch (error: any) {
      console.error('=== Google Auth: sign in error ===');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Error name:', error?.name);
      console.error('Error status:', error?.status);
      console.error('Error details:', error?.details);
      console.error('Error stack:', error?.stack);
      console.error('Platform:', this.platform.platforms());
      console.error('Is native:', Capacitor.isNativePlatform());
      
      // Додаємо більш детальну обробку помилок
      let errorMessage = 'Помилка входу через Google';
      
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      } else if (error?.code) {
        errorMessage += ` (код: ${error.code})`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      } else {
        errorMessage += ': невідома помилка';
      }
      
      // Спеціальна обробка для Android
      if (Capacitor.isNativePlatform() && this.platform.is('android')) {
        if (error?.message?.includes('Something went wrong')) {
          errorMessage = 'Помилка налаштування Google Auth для Android. Перевірте конфігурацію.';
        } else if (error?.code === 'SIGN_IN_CANCELLED') {
          errorMessage = 'Вхід скасовано користувачем';
        } else if (error?.code === 'SIGN_IN_REQUIRED') {
          errorMessage = 'Потрібна повторна авторизація';
        }
      }
      
      console.error('Final error message:', errorMessage);
      
      await this.toastController.create({
        message: errorMessage,
        duration: 5000,
        position: 'bottom',
        color: 'danger'
      }).then(toast => toast.present());
      
      throw error;
    }
  }

  private async showErrorToast(message: string) {
    await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    }).then(toast => toast.present());
  }
}
