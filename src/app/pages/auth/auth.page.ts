import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from '../../services/firebase.service';
import { ToastController, NavController } from '@ionic/angular';
import { getGoogleConfig } from '../../config/firebase.config';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  user: any = null;
  isLoading = false;
  error = '';
  private auth: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
    // Перевіряємо, чи користувач вже авторизований
    const currentUser = await this.authService.getCurrentUser();
    if (currentUser) {
      console.log('User already logged in, navigating to home...');
      await this.navigateToHome();
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        console.log('Initializing Google Auth for native platform...');
        const config = getGoogleConfig();
        console.log('Google Auth config:', config);
        
        // Ініціалізуємо Google Auth тільки один раз
        await GoogleAuth.initialize({
          scopes: ['profile', 'email'],
          serverClientId: config.clientId,
          iosClientId: '316790340348-3ssptcb7gfgm3l3snnds4ublmblkt4q4.apps.googleusercontent.com',
          androidClientId: '316790340348-plk1ussjj7s4gkuqd5hhcocaes4kk4dv.apps.googleusercontent.com'
        });
        console.log('Google Auth initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Auth:', error);
        await this.showError('Помилка ініціалізації Google Auth');
      }
    }
  }

  async googleLogin() {
    try {
      this.isLoading = true;
      this.error = '';

      console.log('Starting Google login...');
      console.log('Platform:', Capacitor.getPlatform());

      // Перевіряємо, чи Firebase ініціалізований
      console.log('Ensuring Firebase is initialized...');
      await this.firebaseService.ensureFirebaseInitialized();
      console.log('Firebase initialization confirmed');

      // Отримуємо Auth instance з FirebaseService
      this.auth = this.firebaseService.getAuthInstance();
      console.log('Got Auth instance from FirebaseService');

      if (!this.auth) {
        console.error('Failed to get Auth instance from FirebaseService');
        throw new Error('Firebase Auth instance not available');
      }

      if (Capacitor.isNativePlatform()) {
        console.log('Starting native Google sign in...');
        try {
          const googleUser = await GoogleAuth.signIn();
          console.log('Google Auth Response:', JSON.stringify(googleUser, null, 2));
          
          if (!googleUser?.authentication?.idToken) {
            console.error('No ID token in Google Auth response:', googleUser);
            throw new Error('Не вдалося отримати токен автентифікації');
          }

          console.log('Creating Firebase credential...');
          console.log('Google Auth response details:', {
            hasIdToken: !!googleUser?.authentication?.idToken,
            hasAccessToken: !!googleUser?.authentication?.accessToken,
            idTokenLength: googleUser?.authentication?.idToken?.length,
            accessTokenLength: googleUser?.authentication?.accessToken?.length
          });
          
          const credential = GoogleAuthProvider.credential(
            googleUser.authentication.idToken,
            googleUser.authentication.accessToken
          );
          console.log('Firebase credential created successfully');

          console.log('Signing in with Firebase...');
          try {
            // Перевіряємо, чи Firebase ініціалізований
            console.log('Checking Firebase initialization...');
            if (!this.auth) {
              console.error('Firebase Auth not initialized');
              throw new Error('Firebase Auth not initialized');
            }
            console.log('Firebase Auth is initialized');

            console.log('About to call signInWithCredential...');
            console.log('Credential object:', {
              hasIdToken: !!credential.idToken,
              hasAccessToken: !!credential.accessToken,
              credentialType: credential.constructor.name
            });

            const userCredential = await signInWithCredential(this.auth, credential);
            console.log('Firebase sign in successful:', userCredential.user.uid);
            console.log('Firebase user details:', {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL
            });

            // Отримуємо ID токен
            console.log('Getting Firebase ID token...');
            const idToken = await userCredential.user.getIdToken();
            console.log('Firebase ID token obtained, length:', idToken.length);

            // Використовуємо AuthService для обробки успішного входу
            console.log('Calling AuthService.handleSuccessfulLogin...');
            await this.authService.handleSuccessfulLogin({
              id: userCredential.user.uid,
              email: userCredential.user.email || '',
              name: userCredential.user.displayName || 'Користувач',
              imageUrl: userCredential.user.photoURL || '',
              idToken: idToken
            });

            console.log('Login successful, navigating to home...');
            // Не викликаємо navigateToHome тут, оскільки handleSuccessfulLogin вже це робить
          } catch (firebaseError: any) {
            console.error('Firebase sign in error:', firebaseError);
            console.error('Firebase error details:', {
              code: firebaseError.code,
              message: firebaseError.message,
              stack: firebaseError.stack,
              name: firebaseError.name
            });
            
            // Додаткова діагностика
            console.error('Additional error context:', {
              authExists: !!this.auth,
              credentialExists: !!credential,
              googleUserExists: !!googleUser,
              idTokenExists: !!googleUser?.authentication?.idToken
            });
            
            throw new Error(`Помилка входу через Firebase: ${firebaseError.message}`);
          }
        } catch (err: any) {
          console.error('GoogleAuth.signIn error:', err);
          this.error = err?.message || 'Помилка Google авторизації';
          await this.showError(this.error);
          return;
        }
      } else {
        console.log('Starting web Google sign in...');
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({
          prompt: 'select_account'
        });

        const result = await signInWithPopup(this.auth, provider);
        console.log('Firebase sign in successful:', result.user.uid);

        await this.authService.handleSuccessfulLogin({
          id: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || 'Користувач',
          imageUrl: result.user.photoURL || '',
          idToken: await result.user.getIdToken()
        });

        console.log('Login successful, navigating to home...');
        // Не викликаємо navigateToHome тут, оскільки handleSuccessfulLogin вже це робить
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      this.error = error.message || 'Помилка входу через Google. Спробуйте ще раз.';
      await this.showError(this.error);
    } finally {
      this.isLoading = false;
    }
  }

  private async navigateToHome() {
    try {
      console.log('Navigating after successful login...');
      
      // Додаємо невелику затримку для стабільності
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
      
      // Використовуємо NavController для кращої навігації на iOS
      await this.navCtrl.navigateRoot(targetRoute, {
        animated: true,
        animationDirection: 'forward'
      });
      
      console.log('Navigation completed successfully to:', targetRoute);
    } catch (navError) {
      console.error('NavController navigation failed:', navError);
      
      try {
        // Якщо NavController не спрацював, пробуємо через Router
        const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
        const targetRoute = (isFirstLogin === 'true' || isFirstLogin === null) ? '/questions' : '/tabs/home';
        
        await this.router.navigate([targetRoute], {
          replaceUrl: true,
          skipLocationChange: false
        });
        console.log('Router navigation completed successfully to:', targetRoute);
      } catch (routerError) {
        console.error('Router navigation failed:', routerError);
        
        // Якщо і Router не спрацював, використовуємо window.location
        const { value: isFirstLogin } = await Preferences.get({ key: 'isFirstLogin' });
        const targetRoute = (isFirstLogin === 'true' || isFirstLogin === null) ? '/questions' : '/tabs/home';
        window.location.href = targetRoute;
      }
    }
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
